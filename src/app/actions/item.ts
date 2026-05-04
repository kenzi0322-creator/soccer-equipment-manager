'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getItemsSupabase, getItemSupabase, insertItemSupabase, updateItemSupabase, insertItemsBulkSupabase, deleteItemSupabase, updateItemHolderSupabase, updateItemHoldersBulkSupabase, uploadEquipmentImageSupabase } from '@/lib/data/supabaseDb';

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
  const imageFile = formData.get('image') as File | null;

  const oldItem = await getItemSupabase(id);
  if (!oldItem) throw new Error('Item not found');

  let photo_url = oldItem.photo_url;
  if (imageFile && imageFile instanceof File && imageFile.size > 0) {
    try {
      photo_url = await uploadEquipmentImageSupabase(imageFile, id);
    } catch (e: any) {
      console.error('画像アップロードエラー:', e.message);
      // 画像アップロード失敗してもその他の変更は継続
    }
  }

  const updatedItem: Item = {
    ...oldItem,
    code: item_code,
    name,
    category,
    size,
    color,
    owner_team_id,
    shared_flag,
    photo_url,
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
      const targetItem = await getItemSupabase(id);
      if (!targetItem) return { error: '備品が見つかりません' };

      const extractSize = (name: string): string | null => {
        const bracketMatch = name.match(/（([^）]+)）/);
        if (bracketMatch) return bracketMatch[1];
        const suffixMatch = name.match(/(XO|[A-Z])用/);
        if (suffixMatch) return suffixMatch[1];
        return null;
      };
      const targetSize = extractSize(targetItem.name);

      const codePrefixMatch = targetItem.code.match(/^([A-Z]+)/);
      const codePrefix = codePrefixMatch ? codePrefixMatch[1] : null;

      const isRefereeRelated = (name: string) =>
        name.startsWith('レフリー') || name.includes('ワッペンガード');

      const allItems = await getItemsSupabase();
      const relatedIds = allItems
        .filter(item => {
          if (!isRefereeRelated(item.name)) return false;
          if (codePrefix) {
            const itemPrefixMatch = item.code.match(/^([A-Z]+)/);
            const itemPrefix = itemPrefixMatch ? itemPrefixMatch[1] : null;
            if (itemPrefix !== codePrefix) return false;
          }
          if (targetSize) {
            const itemSize = extractSize(item.name);
            if (itemSize && itemSize !== targetSize) return false;
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

// 「レフリーセット」という名前の物理アイテムを「レフリー道具セット（笛・カード・ワッペンなど）」に一括リネーム
export async function renameRefGearItemsAction(): Promise<{ renamed: number; error?: string }> {
  try {
    const allItems = await getItemsSupabase();
    const targets = allItems.filter(i => i.name === 'レフリーセット' || i.name.endsWith('レフリーセット'));
    let renamed = 0;
    for (const item of targets) {
      await updateItemSupabase({
        ...item,
        name: 'レフリー道具セット（笛・カード・ワッペンなど）',
      });
      renamed++;
    }
    revalidatePath('/');
    revalidatePath('/items');
    return { renamed };
  } catch (e: any) {
    console.error('Rename RefGear Error:', e);
    return { renamed: 0, error: e.message };
  }
}
