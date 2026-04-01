'use server';

import { getEventRequiredItems, saveEventRequiredItems } from '@/lib/data/db';
import { revalidatePath } from 'next/cache';

export async function incrementItemQuantityAction(eventId: string, itemId: string) {
  try {
    const eris = await getEventRequiredItems();
    
    // Add another instance of the same item to the event
    eris.push({
      id: 'eri_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
      event_id: eventId,
      item_id: itemId,
      required_flag: true,
      assignment_status: 'unassigned'
    });

    await saveEventRequiredItems(eris);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    console.error('Increment Quantity Error:', e);
    return { error: '数量の追加に失敗しました。' };
  }
}
