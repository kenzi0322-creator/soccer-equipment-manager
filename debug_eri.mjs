// Supabase ERI デバッグスクリプト
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnwfyzzlplqknbgfncnf.supabase.co',
  'sb_publishable_qAv5MQ8QKcC9ipSfzkhKYQ_65v1CzBv'
);

// 1. event_required_items の実際のカラムを確認
const { data: eris, error } = await supabase
  .from('event_required_items')
  .select('*')
  .limit(5);

if (error) {
  console.error('Error:', error);
} else {
  console.log('=== ERI columns (first row) ===');
  if (eris.length > 0) {
    console.log('Columns:', Object.keys(eris[0]));
    console.log('Sample row:', JSON.stringify(eris[0], null, 2));
  }
}

// 2. 4/29イベントのERI状況
const { data: events } = await supabase
  .from('events')
  .select('id, legacy_id, title, event_date')
  .eq('event_date', '2026-04-29');

console.log('\n=== 4/29 Events ===');
console.log(JSON.stringify(events, null, 2));

if (events && events.length > 0) {
  for (const ev of events) {
    const { data: evEris } = await supabase
      .from('event_required_items')
      .select('*')
      .eq('event_id', ev.id);
    
    console.log(`\n=== ERIs for event: ${ev.title} ===`);
    console.log(`Count: ${evEris?.length}`);
    evEris?.forEach(e => {
      console.log(`  - template_key:${e.template_key} display:${e.display_name} assignee_member_id:${e.assignee_member_id} selected_item:${e.selected_equipment_item_id} is_personal:${e.is_personal_carry}`);
    });
  }
}
