'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getEventSupabase, insertEventSupabase, updateEventSupabase, deleteEventSupabase, getEventRequiredItemsSupabase, insertErisSupabase, deleteEriSupabase, updateEriSupabase } from '@/lib/data/supabaseDb';
import type { Event } from '@/types';

export async function createEventAction(formData: FormData) {
  const id = 'ev_' + Date.now().toString();
  const newEvent: Event = {
    id,
    title: formData.get('title') as string,
    date: formData.get('date') as string,
    start_at: (formData.get('start_at') as string) || undefined,
    end_at: (formData.get('end_at') as string) || undefined,
    venue_id: (formData.get('venue_id') as string) || '',
    primary_team_id: formData.get('primary_team_id') as string,
    is_joint_match: formData.get('is_joint_match') === 'on',
    referee_time: (formData.get('referee_time') as string) || undefined,
    main_referee_id: (formData.get('main_referee_id') as string) || undefined,
    sub_referee_id: (formData.get('sub_referee_id') as string) || undefined,
    sub_referee_id_2: (formData.get('sub_referee_id_2') as string) || undefined,
    note: (formData.get('note') as string) || undefined,
  };

  try {
    await insertEventSupabase(newEvent);
    revalidatePath('/events');
  } catch (e: any) {
    console.error('Create Event Error:', e);
    return { error: '登録に失敗しました: ' + e.message };
  }
  redirect(`/events/${id}`);
}

export async function deleteEventAction(id: string) {
  try {
    await deleteEventSupabase(id);
    revalidatePath('/events');
  } catch (e: any) {
    console.error('Delete Event Error:', e);
    return { error: '削除に失敗しました: ' + e.message };
  }
  redirect('/events'); // try/catch の外でredirectするとNEXT_REDIRECTが正常に伝播する
}

export async function updateEventAction(formData: FormData) {
  const id = formData.get('id') as string;
  try {
    const existingEvent = await getEventSupabase(id);
    if (!existingEvent) return { error: 'イベントが見つかりません' };
    
    const updatedEvent: any = {
      ...existingEvent,
      title: formData.get('title') as string,
      date: formData.get('date') as string,
      start_at: (formData.get('start_at') as string) || undefined,
      end_at: (formData.get('end_at') as string) || undefined,
      venue_id: formData.get('venue_id') as string,
      primary_team_id: formData.get('primary_team_id') as string,
      is_joint_match: formData.get('is_joint_match') === 'on',
      referee_time: (formData.get('referee_time') as string) || undefined,
      main_referee_id: (formData.get('main_referee_id') as string) || undefined,
      sub_referee_id: (formData.get('sub_referee_id') as string) || undefined,
      sub_referee_id_2: (formData.get('sub_referee_id_2') as string) || undefined,
      note: (formData.get('note') as string) || undefined,
    };

    await updateEventSupabase(updatedEvent);
    
    // Auto-Propose Logic: If referee is assigned
    const hasRefereeNow = !!updatedEvent.main_referee_id || !!updatedEvent.sub_referee_id || !!updatedEvent.referee_time;

    if (hasRefereeNow) {
      const { getItemsSupabase } = await import('@/lib/data/supabaseDb');
      const items = await getItemsSupabase();
      const eris = await getEventRequiredItemsSupabase();
      
      const refItems = items.filter(i => 
        i.category === 'REFEREE' || 
        i.category === 'main_referee' || 
        i.category === 'assistant_referee' || 
        i.name.includes('審判') || 
        i.name.includes('ホイッスル') || 
        i.name.includes('フラッグ')
      );

      const hasAlreadyInRequired = eris.some(e => 
        e.event_id === id && 
        refItems.some(ri => ri.id === e.item_id)
      );

      if (!hasAlreadyInRequired) {
        const toInsert: any[] = [];
        for (const rItem of refItems) {
          if (!eris.some(e => e.event_id === id && e.item_id === rItem.id)) {
            let assignedMemberId = updatedEvent.main_referee_id || updatedEvent.sub_referee_id;
            const isAssistantItem = rItem.category === 'assistant_referee' || rItem.name.includes('フラッグ');
            if (isAssistantItem && updatedEvent.sub_referee_id) {
              assignedMemberId = updatedEvent.sub_referee_id;
            }

            toInsert.push({
              id: 'eri_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
              event_id: id,
              item_id: rItem.id,
              required_flag: true,
              assignment_status: assignedMemberId ? 'ready' : 'unassigned',
              assigned_member_id: assignedMemberId
            });
          }
        }
        if (toInsert.length > 0) {
          await insertErisSupabase(toInsert);
        }
      }
    }

    revalidatePath('/events');
    revalidatePath(`/events/${id}`);
    // revalidatePath and redirect work fine if successful
  } catch (e: any) {
    console.error('Update Event Error:', e);
    return { error: '更新に失敗しました。本番環境（Vercel）ではデータの保存にサーバー側の設定が必要です。' };
  }
  redirect(`/events/${id}`);
}

export async function addRequiredItemAction(formData: FormData) {
  const event_id = formData.get('event_id') as string;
  const item_id = formData.get('item_id') as string;
  const is_personal_item = formData.get('is_personal_item') === 'true';
  const force_assign_to = formData.get('force_assign_to') as string || undefined;

  if (!event_id || !item_id) return { error: 'パラメータが不足しています' };

  try {
    const eris = await getEventRequiredItemsSupabase();
    if (eris.some(e => e.event_id === event_id && e.item_id === item_id)) {
      return { message: '既に追加されています' };
    }

    const newEri: any = {
      id: 'eri_' + Date.now().toString(),
      event_id,
      item_id,
      required_flag: true,
      assignment_status: force_assign_to ? 'ready' : 'unassigned',
      assigned_member_id: force_assign_to || null,
      is_personal_item
    };
    await insertErisSupabase([newEri]);
    revalidatePath(`/events/${event_id}`);
    return { success: true };
  } catch (e: any) {
    console.error('Add Required Item Error:', e);
    return { error: '追加に失敗しました。本番環境（Vercel）ではデータの保存にサーバー側の設定が必要です。' };
  }
}

export async function removeRequiredItemAction(formData: FormData) {
  const id = formData.get('id') as string;
  const event_id = formData.get('id') as string; // Wait, previous code had a bug here, should be event_id if available
  const actual_event_id = formData.get('event_id') as string;
  
  if (!id || !actual_event_id) return { error: 'パラメータが不足しています' };

  try {
    await deleteEriSupabase(id);
    revalidatePath(`/events/${actual_event_id}`);
    return { success: true };
  } catch (e: any) {
    console.error('Remove Required Item Error:', e);
    return { error: '削除に失敗しました。本番環境（Vercel）ではデータの保存にサーバー側の設定が必要です。' };
  }
}

export async function autoAddStandardEquipmentAction(eventId: string) {
  try {
    const eris = await getEventRequiredItemsSupabase();
    const templates = [
      { key: 'gk', name: 'GKユニ' },
      { key: 'match_ball', name: '試合球' },
      { key: 'warmup_ball', name: 'アップ用ボール' }
    ];
    
    const toInsert: any[] = [];
    for (const t of templates) {
      if (!eris.some(e => e.event_id === eventId && e.template_key === t.key)) {
        toInsert.push({
          id: 'eri_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
          event_id: eventId,
          template_key: t.key,
          display_name: t.name,
          required_flag: true,
          assignment_status: 'unassigned'
        });
      }
    }

    if (toInsert.length > 0) {
      await insertErisSupabase(toInsert);
      revalidatePath(`/events/${eventId}`);
      return { success: true, addedCount: toInsert.length };
    }
    return { success: false, message: '既に全ての標準備品が追加されています' };
  } catch (e: any) {
    console.error('Auto Add Equipment Error:', e);
    return { error: '自動追加に失敗しました。' };
  }
}

export async function addRefereeSetAction(eventId: string) {
  try {
    const eris = await getEventRequiredItemsSupabase();
    const refereeTemplates = [
      { key: 'ref_half', name: 'レフリー半袖' },
      { key: 'ref_long', name: 'レフリー長袖' },
      { key: 'ref_pants', name: 'レフリーパンツ' },
      { key: 'ref_socks', name: 'レフリーソックス' },
      { key: 'ref_flags', name: 'レフリーフラッグ' },
      { key: 'ref_bag', name: 'レフリー袋' }
    ];
    
    const toInsert: any[] = [];
    for (const rt of refereeTemplates) {
      if (!eris.some(e => e.event_id === eventId && e.template_key === rt.key)) {
        toInsert.push({
          id: 'eri_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
          event_id: eventId,
          template_key: rt.key,
          display_name: rt.name,
          required_flag: true,
          assignment_status: 'unassigned'
        });
      }
    }

    if (toInsert.length > 0) {
      await insertErisSupabase(toInsert);
      revalidatePath(`/events/${eventId}`);
      return { success: true, addedCount: toInsert.length };
    }
    return { success: false, message: '既にレフリーセットが追加されています' };
  } catch (e: any) {
    console.error('Add Referee Set Error:', e);
    return { error: 'レフリーセットの追加に失敗しました。' };
  }
}

export async function updateEriAssignmentAction(formData: FormData) {
  const eriId = formData.get('eri_id') as string;
  const eventId = formData.get('event_id') as string;
  const itemId = formData.get('item_id') as string;
  const memberId = formData.get('member_id') as string;

  if (!eriId || !eventId || !itemId || !memberId) {
    console.error('Validation failed: Missing parameters');
    return { error: 'パラメータが不足しています' };
  }

  try {
    const eris = await getEventRequiredItemsSupabase();
    const index = eris.findIndex(e => e.id === eriId);
    
    if (index === -1) return { error: '対象の備品要求が見つかりません' };

    const isPersonal = itemId === '__personal__';
    const finalItemId = isPersonal ? null : itemId;

    await updateEriSupabase(eriId, {
      item_id: finalItemId,
      assigned_member_id: memberId,
      assignment_status: 'ready',
      is_personal_item: isPersonal
    });

    // --- Bulk Referee Assignment Logic ---
    if (formData.get('bulk_referee') === 'true') {
      const currentEri = eris[index];
      if (currentEri.template_key && currentEri.template_key.startsWith('ref_')) {
        const { getItemsSupabase } = await import('@/lib/data/supabaseDb');
        const items = await getItemsSupabase();
        
        let baseSize = '';
        if (!isPersonal && finalItemId) {
          const selectedItem = items.find(i => i.id === finalItemId);
          if (selectedItem?.name) {
            const match = selectedItem.name.match(/\((.*?)\)/);
            if (match && match[1]) {
              baseSize = match[1]; // e.g., "M", "L", "XO"
            }
          }
        }

        const otherRefEris = eris.filter(e => 
          e.event_id === eventId && 
          e.id !== eriId && 
          e.template_key && 
          e.template_key.startsWith('ref_')
        );

        for (const req of otherRefEris) {
          let matchingItemId = null;
          if (!isPersonal && baseSize) {
            const keyMappings: Record<string, string> = {
              'ref_half': '半袖',
              'ref_long': '長袖',
              'ref_pants': 'パンツ',
              'ref_socks': 'ソックス',
              'ref_flags': 'フラッグ',
              'ref_bag': '袋'
            };
            const keyword = keyMappings[req.template_key as keyof typeof keyMappings];
            
            if (keyword) {
               matchingItemId = items.find(i => {
                 if (i.category !== 'shared') return false;
                 if (!i.name.includes(keyword)) return false;
                 // Flag doesn't typically have size constraints
                 if (keyword !== 'フラッグ' && !i.name.includes(`(${baseSize})`)) return false;
                 
                 // Ensure the item isn't already assigned to some OTHER requirement (like a different match entirely or another ref)
                 // For simplicity, we just check within this event
                 const isAssigned = eris.some(e => e.event_id === eventId && e.item_id === i.id && e.id !== req.id && e.id !== eriId);
                 return !isAssigned;
               })?.id || null;
            }
          }

          // Update the other referee requirements: 
          // Always assign them to the same member. 
          // Give them the corresponding matching item if found, else null (unassigned item, but member is assigned).
          await updateEriSupabase(req.id, {
            item_id: isPersonal ? null : matchingItemId,
            assigned_member_id: memberId,
            assignment_status: 'ready',
            is_personal_item: isPersonal
          });
        }
      }
    }
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/assign/${eriId}`);
    return { success: true };
  } catch (e: any) {
    console.error('Update Assignment Error:', e);
    return { error: `割り当ての更新に失敗しました: ${e.message}` };
  }
}
