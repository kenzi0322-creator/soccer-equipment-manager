'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getItemSupabase, insertItemSupabase, updateItemSupabase, insertItemsBulkSupabase, deleteItemSupabase, updateItemHolderSupabase } from '@/lib/data/supabaseDb';
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
    code: item_code,
    name,
    category,
    size,
    color,
    owner_team_id,
    shared_flag,
    current_holder_id: null,
  };

  await insertItemSupabase(newItem);

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
  const oldItem = await getItemSupabase(id);
  
  if (!oldItem) throw new Error('Item not found');

  const updatedItem: Item = {
    ...oldItem,
    code: item_code,
    name,
    category,
    size,
    color,
    owner_team_id,
    shared_flag,
  };

  await updateItemSupabase(updatedItem);

  revalidatePath(`/items/${id}`);
  revalidatePath('/');
  redirect(`/items/${id}`);
}

export async function bulkImportItemsAction(parsedData: any[]) {
  
  const newItems: Item[] = parsedData.map(d => ({
    id: generateId(),
    code: d.item_code || '',
    name: d.name || '名称未設定',
    category: d.category || 'OTHER',
    size: d.size || '',
    color: d.color || '',
    owner_team_id: d.owner_team_id || 't1', // default team
    shared_flag: true, // managed as shared resource initially
    current_holder_id: null,
    note: d.description || d.note || '',
  }));

  await insertItemsBulkSupabase(newItems);
  
  revalidatePath('/');
  revalidatePath('/items');
  return { success: true, count: newItems.length };
}

export async function deleteItemAction(formData: FormData) {
  const id = formData.get('id') as string;
  
  await deleteItemSupabase(id);
  
  revalidatePath('/items');
  redirect('/');
}

export async function updateItemHolderAction(formData: FormData) {
  const id = formData.get('id') as string;
  const current_holder_id = formData.get('current_holder_id') as string;
  const last_handoff_at = formData.get('last_handoff_at') as string;

  if (!id) return { error: 'IDが不足しています' };

  try {
    await updateItemHolderSupabase(id, current_holder_id || null, last_handoff_at);
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    console.error('Update Holder Error:', e);
    return { error: '更新に失敗しました' };
  }
}
