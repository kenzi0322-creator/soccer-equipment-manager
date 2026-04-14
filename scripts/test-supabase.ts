import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  const eris = await supabase.from('event_required_items')
    .select('*, event:events(legacy_id), assignee:members(legacy_id), item:equipment_items(legacy_id)')
    .limit(1);
    
  if (eris.data && eris.data.length > 0) {
    console.log('Joined eris full:', eris.data[0]);
  } else {
    console.log('Error joined eris full:', eris.error);
  }
}

check();
