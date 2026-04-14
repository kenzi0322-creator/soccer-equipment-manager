'use server';

import { getEventRequiredItemsSupabase, insertErisSupabase } from '@/lib/data/supabaseDb';
import { revalidatePath } from 'next/cache';

export async function incrementItemQuantityAction(eventId: string, eriId: string) {
  try {
    const eris = await getEventRequiredItemsSupabase();
    const sourceEri = eris.find(e => e.id === eriId);

    if (!sourceEri) return { error: '元の必要備品が見つかりません。' };
    
    // Add another instance of the exact same requirement
    await insertErisSupabase([{
      id: 'eri_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
      event_id: eventId,
      template_key: sourceEri.template_key,
      display_name: sourceEri.display_name,
      required_flag: true,
      assignment_status: 'unassigned'
    }]);

    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    console.error('Increment Quantity Error:', e);
    return { error: '数量の追加に失敗しました。' };
  }
}
