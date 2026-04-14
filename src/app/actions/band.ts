'use server';

import { revalidatePath } from 'next/cache';
import { getVenues, getTeams } from '@/lib/data/db';
import { getEventsSupabase, insertEventSupabase, updateEventSupabase, updateEventSyncStatusSupabase, getEventRequiredItemsSupabase } from '@/lib/data/supabaseDb';
import { Event as AppEvent } from '@/types';

function parseDateStr(dtStr: string) {
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

export type BandSyncPreviewItem = {
  type: 'new' | 'changed' | 'deleted_in_source' | 'no_change';
  eventData: AppEvent;
  existingEvent?: AppEvent;
  isStarted: boolean;
};

export async function getBandSyncPreview(formData: FormData) {
  let url = formData.get('band_url') as string;
  if (!url) return { error: 'URLが入力されていません' };
  if (url.startsWith('webcal://')) url = url.replace('webcal://', 'https://');

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('カレンダーデータの取得に失敗しました');
    const icalText = await res.text();

    const [existingEvents, allVenues, allTeams, eris] = await Promise.all([
      getEventsSupabase(),
      getVenues(),
      getTeams(),
      getEventRequiredItemsSupabase()
    ]);
    
    const eventsRaw = icalText.split('BEGIN:VEVENT');
    const bandEvents: AppEvent[] = [];

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
        const location = extractField('LOCATION');
        const start = extractField('DTSTART');
        const end = extractField('DTEND');
        
        if (!uid || !summary || !start) continue;

        const parsedStart = parseDateStr(start);
        const parsedEnd = parseDateStr(end);
        if (!parsedStart) continue;

        let mappedVenueId = 'v1';
        if (location) {
            const matchedVenue = allVenues.find(v => location.includes(v.name) || (v.address && location.includes(v.address)));
            if (matchedVenue) mappedVenueId = matchedVenue.id;
        }
        let mappedTeamId = 't1';
        const matchedTeam = allTeams.find(t => summary.includes(t.name));
        if (matchedTeam) mappedTeamId = matchedTeam.id;

        bandEvents.push({
            id: uid, 
            external_event_id: uid,
            title: summary,
            date: parsedStart.date,
            start_at: parsedStart.time,
            end_at: parsedEnd ? parsedEnd.time : undefined,
            note: description,
            venue_id: mappedVenueId, 
            primary_team_id: mappedTeamId,
            is_joint_match: summary.includes('合同') || summary.includes('連合'),
        });
    }

    const preview: BandSyncPreviewItem[] = [];
    const bandUids = new Set(bandEvents.map(e => e.id));

    for (const bEvent of bandEvents) {
        const existing = existingEvents.find(e => e.id === bEvent.id || e.external_event_id === bEvent.id);
        
        if (!existing) {
            preview.push({ type: 'new', eventData: bEvent, isStarted: false });
        } else {
            const isDifferent = 
                existing.title !== bEvent.title ||
                existing.date !== bEvent.date ||
                existing.start_at !== bEvent.start_at ||
                existing.venue_id !== bEvent.venue_id ||
                existing.note !== bEvent.note;
            
            const hasEris = eris.some(eri => eri.event_id === existing.id);
            const hasReferees = existing.main_referee_id || existing.sub_referee_id;
            const isVenueEdited = existing.venue_id && existing.venue_id !== 'v1' && existing.venue_id !== bEvent.venue_id;
            const isStarted = !!(hasEris || hasReferees || isVenueEdited);

            if (isDifferent) {
                preview.push({ type: 'changed', eventData: bEvent, existingEvent: existing, isStarted });
            } else {
                preview.push({ type: 'no_change', eventData: bEvent, existingEvent: existing, isStarted });
            }
        }
    }

    for (const eEvent of existingEvents) {
        if (eEvent.external_event_id && !bandUids.has(eEvent.external_event_id)) {
            const hasEris = eris.some(eri => eri.event_id === eEvent.id);
            preview.push({ 
                type: 'deleted_in_source', 
                eventData: eEvent, 
                existingEvent: eEvent, 
                isStarted: hasEris || !!eEvent.main_referee_id || !!eEvent.sub_referee_id
            });
        }
    }

    return { success: true, preview };
  } catch (err: any) {
    return { error: err.message || 'カレンダーの読み込みに失敗しました' };
  }
}

export async function commitBandSync(selections: { uid: string, type: string, action: 'apply' | 'skip' | 'cancel' }[], bandEvents: AppEvent[]) {
    try {
        const existingEvents = await getEventsSupabase();
        
        for (const sel of selections) {
            if (sel.action === 'skip') continue;
            
            if (sel.type === 'new' && sel.action === 'apply') {
                const bEvent = bandEvents.find(e => e.id === sel.uid);
                if (bEvent) await insertEventSupabase(bEvent);
            } else if (sel.type === 'changed' && sel.action === 'apply') {
                const bEvent = bandEvents.find(e => e.id === sel.uid);
                const existing = existingEvents.find(e => e.id === sel.uid || e.external_event_id === sel.uid);
                if (bEvent && existing) {
                    await updateEventSupabase({
                        ...existing,
                        title: bEvent.title,
                        date: bEvent.date,
                        start_at: bEvent.start_at,
                        end_at: bEvent.end_at,
                        note: bEvent.note || existing.note,
                        venue_id: bEvent.venue_id, // Note: The UI should warn if this overwrites user edits
                        sync_status: 'normal'
                    });
                }
            } else if (sel.type === 'deleted_in_source' && sel.action === 'apply') {
                // The user decided to mark it as cancelled/deleted in app
                const existing = existingEvents.find(e => e.id === sel.uid || e.external_event_id === sel.uid);
                if (existing) {
                    await updateEventSyncStatusSupabase(existing.id, 'deleted_in_source');
                }
            }
        }
        
        revalidatePath('/events');
        return { success: true, message: '同期処理を完了しました' };
    } catch (err: any) {
        return { error: err.message || '同期中にエラーが発生しました' };
    }
}
