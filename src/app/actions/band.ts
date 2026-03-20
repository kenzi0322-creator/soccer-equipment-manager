'use server';

import { revalidatePath } from 'next/cache';
import { getEvents, saveEvents } from '@/lib/data/db';
import { Event } from '@/types';

function parseDateStr(dtStr: string) {
  // Format typically: 20260308T103000
  if (!dtStr || dtStr.length < 8) return null;
  const y = dtStr.substring(0, 4);
  const m = dtStr.substring(4, 6);
  const d = dtStr.substring(6, 8);
  const dateObj = {
    date: `${y}-${m}-${d}`,
    time: undefined as string | undefined
  };
  
  if (dtStr.includes('T') && dtStr.length >= 15) {
    const t = dtStr.split('T')[1];
    const hh = t.substring(0, 2);
    const mm = t.substring(2, 4);
    dateObj.time = `${hh}:${mm}`;
  }
  return dateObj;
}

export async function syncBandSchedule(formData: FormData) {
  let url = formData.get('band_url') as string;
  if (!url) return { error: 'URLが入力されていません' };

  // Convert webcal:// to https://
  if (url.startsWith('webcal://')) {
    url = url.replace('webcal://', 'https://');
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('カレンダーデータの取得に失敗しました');
    const icalText = await res.text();

    const existingEvents = await getEvents();
    const newEvents = [...existingEvents];

    // Simple VEVENT parser
    const eventsRaw = icalText.split('BEGIN:VEVENT');
    // First element is calendar header, skip it
    
    let addedCount = 0;
    let updatedCount = 0;

    for (let i = 1; i < eventsRaw.length; i++) {
      const block = eventsRaw[i].split('END:VEVENT')[0];
      
      const extractField = (key: string) => {
        const regex = new RegExp(`${key}[^:]*:(.*)`, 'm');
        const match = block.match(regex);
        return match ? match[1].trim().replace(/\\n/g, '\n').replace(/\\,/g, ',') : '';
      };
      
      const uid = extractField('UID');
      const summary = extractField('SUMMARY');
      const description = extractField('DESCRIPTION');
      const start = extractField('DTSTART');
      const end = extractField('DTEND');
      
      if (!uid || !summary || !start) continue;

      const parsedStart = parseDateStr(start);
      const parsedEnd = parseDateStr(end);

      if (!parsedStart) continue;

      const eventData: Event = {
        id: uid, // Use Band UID to avoid duplicates
        title: summary,
        date: parsedStart.date,
        start_at: parsedStart.time,
        end_at: parsedEnd ? parsedEnd.time : undefined,
        note: description,
        // Default mappings (user can edit later)
        venue_id: 'v1', 
        primary_team_id: 't1',
        is_joint_match: false,
      };

      const existingIdx = newEvents.findIndex(e => e.id === uid);
      if (existingIdx >= 0) {
        // Update keeping local modifications if wanted, but for now we overwrite everything except maybe team/venue?
        // Let's overwrite title/date but keep local venue/team if they edited it.
        newEvents[existingIdx] = {
           ...newEvents[existingIdx],
           title: eventData.title,
           date: eventData.date,
           start_at: eventData.start_at,
           end_at: eventData.end_at,
           note: eventData.note,
        };
        updatedCount++;
      } else {
        newEvents.push(eventData);
        addedCount++;
      }
    }

    await saveEvents(newEvents);
    revalidatePath('/events');
    return { success: true, message: `${addedCount}件登録、${updatedCount}件更新しました！` };

  } catch (err: any) {
    return { error: err.message || '同期中にエラーが発生しました' };
  }
}
