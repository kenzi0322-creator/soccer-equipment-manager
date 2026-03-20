import { notFound } from 'next/navigation';
import { getItem } from '@/lib/data/db';
import ItemDetailClient from '@/components/ItemDetailClient';

export default async function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const item = await getItem(id);
  
  if (!item) return notFound();

  return <ItemDetailClient initialItem={item} />;
}
