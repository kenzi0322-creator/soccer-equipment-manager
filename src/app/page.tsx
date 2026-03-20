import { getItems } from '@/lib/data/db';
import EquipmentListClient from '@/components/EquipmentListClient';

export default async function Home() {
  const items = await getItems();

  return <EquipmentListClient initialItems={items} />;
}
