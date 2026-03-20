import { notFound } from 'next/navigation';
import { Edit3 } from 'lucide-react';
import EquipmentForm from '@/components/EquipmentForm';
import { updateItem } from '@/app/actions/item';
import { getItem } from '@/lib/data/db';
import Link from 'next/link';

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const initialItem = await getItem(id);
  
  if (!initialItem) return notFound();

  const updateItemWithId = updateItem.bind(null, id);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Link href={`/items/${id}`} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
          <span className="text-sm font-bold">&larr; 戻る</span>
        </Link>
        <span className="font-medium text-slate-800 ml-2">備品の編集</span>
      </div>

      <div className="flex justify-center mb-2">
        <div className="bg-orange-50 p-4 rounded-full text-orange-600">
          <Edit3 size={32} />
        </div>
      </div>

      <EquipmentForm initialData={initialItem} action={updateItemWithId} submitLabel="変更を保存する" />
    </div>
  );
}
