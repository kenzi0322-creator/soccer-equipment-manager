'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getItemsSupabase, getItemSupabase, insertItemSupabase, updateItemSupabase, insertItemsBulkSupabase, deleteItemSupabase, updateItemHolderSupabase, updateItemHoldersBulkSupabase } from '@/lib/data/supabaseDb';

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
  const bulk_referee = formData.get('bulk_referee') === 'true';

  if (!id) return { error: 'IDが不足しています' };

  try {
    if (bulk_referee) {
      // Fetch the selected item to extract size and code prefix
      const targetItem = await getItemSupabase(id);
      if (!targetItem) return { error: '備品が見つかりません' };

      // Extract size tag like （M）、（L）、（XO） from name
      const sizeMatch = targetItem.name.match(/（([^）]+)）/);
      const sizeTag = sizeMatch ? `（${sizeMatch[1]}）` : null;

      // Extract code prefix: S, T, O, B etc. (first letter(s) before the number)
      const codePrefixMatch = targetItem.code.match(/^([A-Z]+)/);
      const codePrefix = codePrefixMatch ? codePrefixMatch[1] : null;

      // Fetch all items and find related referee items
      const allItems = await getItemsSupabase();
      const relatedIds = allItems
        .filter(item => {
          if (!item.name.startsWith('レフリー')) return false;
          // Must share the same code prefix (same team/set group)
          if (codePrefix) {
            const itemPrefixMatch = item.code.match(/^([A-Z]+)/);
            const itemPrefix = itemPrefixMatch ? itemPrefixMatch[1] : null;
            if (itemPrefix !== codePrefix) return false;
          }
          // If original had a size, only match items with same size OR items without size (like レフリーフラッグ)
          if (sizeTag) {
            const hasSize = /（[^）]+）/.test(item.name);
            if (hasSize && !item.name.includes(sizeTag)) return false;
          }
          return true;
        })
        .map(item => item.id);

      if (relatedIds.length > 0) {
        await updateItemHoldersBulkSupabase(relatedIds, current_holder_id || null);
      }
    } else {
      await updateItemHolderSupabase(id, current_holder_id || null, last_handoff_at);
    }

    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    console.error('Update Holder Error:', e);
    return { error: '更新に失敗しました' };
  }
}

