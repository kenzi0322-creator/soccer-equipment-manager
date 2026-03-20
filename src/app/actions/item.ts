'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { saveItem, updateItemInDb } from '@/lib/data/db';
import { Item } from '@/types';

function generateId() {
  return 'i' + Math.random().toString(36).substr(2, 9);
}

export async function createItem(formData: FormData) {
  const name = formData.get('name') as string;
  const item_code = formData.get('item_code') as string;
  const category = formData.get('category') as string;
  const size = formData.get('size') as string;
  const color = formData.get('color') as string;
  const owner_team_id = formData.get('owner_team_id') as string;
  const shared_flag = formData.get('shared_flag') === 'on';

  const newItem: Item = {
    id: generateId(),
    item_code,
    name,
    category,
    size,
    color,
    owner_team_id,
    shared_flag,
    current_holder_id: null,
  };

  await saveItem(newItem);

  revalidatePath('/');
  redirect('/');
}

export async function updateItem(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const item_code = formData.get('item_code') as string;
  const category = formData.get('category') as string;
  const size = formData.get('size') as string;
  const color = formData.get('color') as string;
  const owner_team_id = formData.get('owner_team_id') as string;
  const shared_flag = formData.get('shared_flag') === 'on';

  // We construct a partial object, the rest are kept by DB update logic if it were real.
  // BUT our db.ts `updateItemInDb` actually expects the full Item currently. Let's fetch the old one.
  const { getItem } = await import('@/lib/data/db');
  const oldItem = await getItem(id);
  
  if (!oldItem) throw new Error('Item not found');

  const updatedItem: Item = {
    ...oldItem,
    item_code,
    name,
    category,
    size,
    color,
    owner_team_id,
    shared_flag,
  };

  await updateItemInDb(updatedItem);

  revalidatePath(`/items/${id}`);
  revalidatePath('/');
  redirect(`/items/${id}`);
}
