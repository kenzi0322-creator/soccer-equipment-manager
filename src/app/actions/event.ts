'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getEvents, saveEvents, getEventRequiredItems, saveEventRequiredItems } from '@/lib/data/db';

export async function deleteEventAction(id: string) {
  try {
    const events = await getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
      events.splice(index, 1);
      await saveEvents(events);
    }
    revalidatePath('/events');
    redirect('/events');
  } catch (e: any) {
    console.error('Delete Event Error:', e);
    return { error: '削除に失敗しました。本番環境（Vercel）ではデータの保存にサーバー側の設定が必要です。' };
  }
}

export async function updateEventAction(formData: FormData) {
  const id = formData.get('id') as string;
  try {
    const events = await getEvents();
    const index = events.findIndex(e => e.id === id);
    
    if (index === -1) return { error: 'イベントが見つかりません' };

    const existingEvent = events[index];
    
    const updatedEvent = {
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
      note: (formData.get('note') as string) || undefined,
    };

    events[index] = updatedEvent;
    await saveEvents(events);
    
    // Auto-Propose Logic: If referee is assigned
    const hasRefereeNow = !!updatedEvent.main_referee_id || !!updatedEvent.sub_referee_id || !!updatedEvent.referee_time;

    if (hasRefereeNow) {
      const { getItems, getEventRequiredItems, saveEventRequiredItems } = await import('@/lib/data/db');
      const items = await getItems();
      const eris = await getEventRequiredItems();
      
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
        let changedEri = false;
        for (const rItem of refItems) {
          if (!eris.some(e => e.event_id === id && e.item_id === rItem.id)) {
            let assignedMemberId = updatedEvent.main_referee_id || updatedEvent.sub_referee_id;
            const isAssistantItem = rItem.category === 'assistant_referee' || rItem.name.includes('フラッグ');
            if (isAssistantItem && updatedEvent.sub_referee_id) {
              assignedMemberId = updatedEvent.sub_referee_id;
            }

            eris.push({
              id: 'eri_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
              event_id: id,
              item_id: rItem.id,
              required_flag: true,
              assignment_status: assignedMemberId ? 'ready' : 'unassigned',
              assigned_member_id: assignedMemberId
            });
            changedEri = true;
          }
        }
        if (changedEri) {
          await saveEventRequiredItems(eris);
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
    const eris = await getEventRequiredItems();
    if (eris.some(e => e.event_id === event_id && e.item_id === item_id)) {
      return { message: '既に追加されています' };
    }

    eris.push({
      id: 'eri_' + Date.now().toString(),
      event_id,
      item_id,
      required_flag: true,
      assignment_status: force_assign_to ? 'ready' : 'unassigned',
      assigned_member_id: force_assign_to,
      is_personal_item
    });
    await saveEventRequiredItems(eris);
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
    const eris = await getEventRequiredItems();
    const nextEris = eris.filter(e => e.id !== id);
    await saveEventRequiredItems(nextEris);
    revalidatePath(`/events/${actual_event_id}`);
    return { success: true };
  } catch (e: any) {
    console.error('Remove Required Item Error:', e);
    return { error: '削除に失敗しました。本番環境（Vercel）ではデータの保存にサーバー側の設定が必要です。' };
  }
}

export async function autoAddStandardEquipmentAction(eventId: string) {
  try {
    const eris = await getEventRequiredItems();
    const templateIds = ['i_gk_template', 'i_match_ball_template', 'i_warmup_ball_template'];
    
    let addedCount = 0;
    for (const tid of templateIds) {
      // Allow multiple balls if needed? For now just one of each if missing
      if (!eris.some(e => e.event_id === eventId && e.item_id === tid)) {
        eris.push({
          id: 'eri_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
          event_id: eventId,
          item_id: tid,
          required_flag: true,
          assignment_status: 'unassigned'
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      await saveEventRequiredItems(eris);
      revalidatePath(`/events/${eventId}`);
      return { success: true, addedCount };
    }
    return { success: false, message: '既に全ての標準備品が追加されています' };
  } catch (e: any) {
    console.error('Auto Add Equipment Error:', e);
    return { error: '自動追加に失敗しました。' };
  }
}

export async function addRefereeSetAction(eventId: string) {
  try {
    const eris = await getEventRequiredItems();
    const refereeTemplates = [
      { id: 'i_ref_half_template', name: 'レフリー半袖' },
      { id: 'i_ref_long_template', name: 'レフリー長袖' },
      { id: 'i_ref_pants_template', name: 'レフリーパンツ' },
      { id: 'i_ref_socks_template', name: 'レフリーソックス' },
      { id: 'i_ref_flags_template', name: 'レフリーフラッグ' },
      { id: 'i_ref_gear_template', name: 'レフリー機材（ホイッスル等）' }
    ];
    
    let addedCount = 0;
    for (const rt of refereeTemplates) {
      if (!eris.some(e => e.event_id === eventId && e.item_id === rt.id)) {
        eris.push({
          id: 'eri_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
          event_id: eventId,
          item_id: rt.id,
          required_flag: true,
          assignment_status: 'unassigned'
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      await saveEventRequiredItems(eris);
      revalidatePath(`/events/${eventId}`);
      return { success: true, addedCount };
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
    return { error: 'パラメータが不足しています' };
  }

  try {
    const eris = await getEventRequiredItems();
    const index = eris.findIndex(e => e.id === eriId);
    
    if (index === -1) return { error: '対象の備品要求が見つかりません' };

    const isPersonal = itemId === '__personal__';
    
    eris[index] = {
      ...eris[index],
      item_id: isPersonal ? (eris[index].item_id || itemId) : itemId,
      assigned_member_id: memberId,
      assignment_status: 'ready',
      is_personal_item: isPersonal
    };

    await saveEventRequiredItems(eris);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    console.error('Update Assignment Error:', e);
    return { error: '割り当ての更新に失敗しました。' };
  }
}
