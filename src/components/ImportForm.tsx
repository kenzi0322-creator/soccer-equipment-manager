'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bulkImportItemsAction } from '@/app/actions/item';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight, Save, X } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

export default function ImportForm() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleParse = () => {
    setError('');
    const txt = inputText.trim();
    if (!txt) {
      setError('データが入力されていません。');
      return;
    }
    
    let result: any[] = [];
    
    // Check if JSON
    if (txt.startsWith('[') && txt.endsWith(']')) {
      try {
        result = JSON.parse(txt);
      } catch (e: any) {
        setError('JSONの解析に失敗しました: ' + e.message);
        return;
      }
    } else {
      // Parse CSV
      const lines = txt.split('\n');
      if (lines.length < 2) {
        setError('CSVヘッダーと少なくとも1行のデータが必要です。');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = vals[idx] || '';
        });
        result.push(obj);
      }
    }
    
    // Validate minimal structure
    if (!result.every(r => r.name)) {
      setError('一部のデータに必須項目 "name" が含まれていません。');
      return;
    }
    
    setParsedData(result);
  };
  
  const handleImport = async () => {
    if (!parsedData) return;
    setLoading(true);
    try {
      const res = await bulkImportItemsAction(parsedData);
      if (res?.success) {
        alert(`${res.count}件の備品をインポートしました！`);
        router.push('/');
      }
    } catch (e: any) {
      setError('インポート中にエラーが発生しました: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditCell = (index: number, key: string, value: string) => {
    if (!parsedData) return;
    const newData = [...parsedData];
    newData[index] = { ...newData[index], [key]: value };
    setParsedData(newData);
  };

  const handleRemoveRow = (index: number) => {
    if (!parsedData) return;
    const newData = [...parsedData];
    newData.splice(index, 1);
    setParsedData(newData);
  };

  const sampleCSV = `name,item_code,category,description
試合球（5号）,BALL-001,BALL,検定球
コーナーフラッグセット,FLAG-001,FACILITY,ポールとフラッグ4本
審判用ホイッスル,REF-001,REFEREE,ドルフィンプロ
主審用フェアプレーワッペン,REF-002,REFEREE,ベルクロ式
救急箱セット,MED-001,MEDICAL,テーピング・コールドスプレー含む`;

  const sampleJSON = `[
  {"name": "試合球（5号）", "item_code": "BALL-001", "category": "BALL", "description": "検定球"},
  {"name": "審判用ホイッスル", "item_code": "REF-001", "category": "REFEREE"}
]`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {!parsedData ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
              <Upload size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">一括インポート</h2>
              <p className="text-xs text-slate-500 mt-1">CSVまたはJSON形式のテキストを貼り付けてください</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="ここにCSV/JSONを貼り付け..."
                className="w-full h-80 p-4 font-mono text-sm border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none"
              />
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2 rounded-lg items-center">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleParse}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-transform active:scale-95"
                >
                  パースしてプレビュー <ArrowRight size={18} />
                </button>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-fit space-y-4">
              <h3 className="font-bold text-sm text-slate-700 flex items-center gap-1.5">
                <FileText size={16} className="text-slate-400" />
                フォーマット例
              </h3>
              
              <div>
                <span className="text-xs font-bold text-slate-500 mb-1 block">CSV形式:</span>
                <pre className="text-[10px] bg-white p-2 border border-slate-200 rounded-lg overflow-x-auto text-slate-600">
                  {sampleCSV}
                </pre>
              </div>
              
              <div>
                <span className="text-xs font-bold text-slate-500 mb-1 block">JSON形式:</span>
                <pre className="text-[10px] bg-white p-2 border border-slate-200 rounded-lg overflow-x-auto text-slate-600">
                  {sampleJSON}
                </pre>
              </div>
              
              <ul className="text-xs text-slate-500 list-disc pl-4 space-y-1">
                <li><span className="font-bold">name</span> は必須です</li>
                <li>初期状態では「共有備品」として登録されます</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2.5 rounded-xl text-green-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">プレビューと修正</h2>
                <p className="text-xs text-slate-500 mt-1">{parsedData.length} 件のデータが読み込まれました</p>
              </div>
            </div>
            
            <button
              onClick={() => setParsedData(null)}
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors underline"
            >
              再入力する
            </button>
          </div>
          
          <div className="overflow-x-auto mb-6 bg-slate-50 rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-3">用具名 (name) *</th>
                  <th className="p-3">コード (item_code)</th>
                  <th className="p-3">カテゴリ (category)</th>
                  <th className="p-3">備考 (description)</th>
                  <th className="p-3 w-10 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100/50 hover:bg-blue-50/30 transition-colors">
                    <td className="p-2 w-1/4">
                      <input 
                        type="text" 
                        value={row.name || ''} 
                        onChange={e => handleEditCell(i, 'name', e.target.value)}
                        className={clsx("w-full bg-white border rounded px-2 py-1.5 focus:border-blue-500 outline-none", !row.name && "border-red-300 bg-red-50")}
                      />
                    </td>
                    <td className="p-2">
                       <input 
                        type="text" 
                        value={row.item_code || ''} 
                        onChange={e => handleEditCell(i, 'item_code', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="p-2">
                       <input 
                        type="text" 
                        value={row.category || ''} 
                        onChange={e => handleEditCell(i, 'category', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none uppercase"
                      />
                    </td>
                    <td className="p-2">
                       <input 
                        type="text" 
                        value={row.description || row.note || ''} 
                        onChange={e => handleEditCell(i, 'description', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="p-2 text-center">
                       <button onClick={() => handleRemoveRow(i)} className="text-slate-400 hover:text-red-500 p-1 transition-colors">
                         <X size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length === 0 && (
              <div className="text-center p-8 text-slate-400 text-sm">
                データがありません
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <Link href="/" className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">キャンセル</Link>
            
            <button
              onClick={handleImport}
              disabled={loading || parsedData.length === 0 || !parsedData.every(r => r.name)}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-sm transition-transform active:scale-95"
            >
              {loading ? 'インポート中...' : <><Save size={18} /> インポート実行</>}
            </button>
          </div>
          
        </div>
      )}
      
    </div>
  );
}
