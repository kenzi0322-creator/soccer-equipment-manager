import { PackagePlus } from 'lucide-react';
import EquipmentForm from '@/components/EquipmentForm';
import { createItem } from '@/app/actions/item';
import { getTeams } from '@/lib/data/db';
import Link from 'next/link';

export default async function NewItemPage() {
  const teams = await getTeams();

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Link href="/items" className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
          <span className="text-sm font-bold">&larr; 戻る</span>
        </Link>
        <span className="font-medium text-slate-800 ml-2">新規備品の登録</span>
      </div>

      <div className="flex justify-center mb-2">
        <div className="bg-blue-50 p-4 rounded-full text-blue-600">
          <PackagePlus size={32} />
        </div>
      </div>

      <EquipmentForm action={createItem} submitLabel="登録する" teams={teams} />
    </div>
  );
}
