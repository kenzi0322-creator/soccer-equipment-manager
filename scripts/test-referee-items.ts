import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  const { data: items } = await supabase.from('equipment_items').select('*').like('name', '%レフリー%');
  if (items) {
    items.forEach(i => console.log(`${i.legacy_id} | ${i.code} | ${i.name} | ${i.owner_team_category} | ${i.item_category}`));
  }
}

check();
