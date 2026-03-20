'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getEvents, saveEvents, getEventRequiredItems, saveEventRequiredItems } from '@/lib/data/db';

export async function deleteEventAction(id: string) {
  const events = await getEvents();
  const index = events.findIndex(e => e.id === id);
  if (index !== -1) {
    events.splice(index, 1);
    await saveEvents(events);
  }
  revalidatePath('/events');
  redirect('/events');
}

export async function updateEventAction(formData: FormData) {
  const id = formData.get('id') as string;
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
  
  revalidatePath('/events');
  revalidatePath(`/events/${id}`);
  redirect(`/events/${id}`);
}

export async function addRequiredItemAction(formData: FormData) {
  const event_id = formData.get('event_id') as string;
  const item_id = formData.get('item_id') as string;
  if (!event_id || !item_id) return;

  const eris = await getEventRequiredItems();
  // check duplicate
  if (eris.some(e => e.event_id === event_id && e.item_id === item_id)) return;

  eris.push({
    id: 'eri_' + Date.now().toString(),
    event_id,
    item_id,
    required_flag: true,
    assignment_status: 'unassigned'
  });
  await saveEventRequiredItems(eris);
  revalidatePath(`/events/${event_id}`);
}

export async function removeRequiredItemAction(formData: FormData) {
  const id = formData.get('id') as string;
  const event_id = formData.get('event_id') as string;
  if (!id || !event_id) return;

  const eris = await getEventRequiredItems();
  const nextEris = eris.filter(e => e.id !== id);
  await saveEventRequiredItems(nextEris);
  revalidatePath(`/events/${event_id}`);
}
