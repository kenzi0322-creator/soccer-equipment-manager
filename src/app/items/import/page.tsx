import ImportForm from '@/components/ImportForm';

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">用具の一括インポート</h1>
        <p className="text-slate-500 text-sm mt-1">複数の備品データをまとめて簡単に登録できます。</p>
      </div>

      <ImportForm />
    </div>
  );
}
