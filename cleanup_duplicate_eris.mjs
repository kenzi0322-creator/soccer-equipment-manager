// 全体周知用イベントの未割り当てERIを削除するスクリプト
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnwfyzzlplqknbgfncnf.supabase.co',
  'sb_publishable_qAv5MQ8QKcC9ipSfzkhKYQ_65v1CzBv'
);

// 全体周知用イベントのIDを特定（assignee=nullのERIを持つイベント）
// ルール：タイトルに「全体周知用」を含むイベントのERIをすべて削除

const { data: events } = await supabase
  .from('events')
  .select('id, title')
  .ilike('title', '%全体周知用%');

console.log('対象イベント:', events);

for (const ev of (events || [])) {
  const { data: eris, error: fetchErr } = await supabase
    .from('event_required_items')
    .select('id, template_key, display_name, assignee_member_id')
    .eq('event_id', ev.id);
  
  console.log(`\n${ev.title} のERI (${eris?.length}件):`);
  eris?.forEach(e => console.log(`  ${e.id} ${e.display_name}`));
  
  if (eris && eris.length > 0) {
    const ids = eris.map(e => e.id);
    const { error: delErr } = await supabase
      .from('event_required_items')
      .delete()
      .in('id', ids);
    
    if (delErr) {
      console.error('削除エラー:', delErr);
    } else {
      console.log(`✅ ${eris.length}件のERIを削除しました`);
    }
  }
}

console.log('\n完了');
