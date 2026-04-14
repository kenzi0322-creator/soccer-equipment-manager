import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testInsert() {
  try {
    const { data: evt } = await supabase.from('events').select('id').eq('legacy_id', '4/99499416/959528375/19700101@band.us').single();
    if (!evt) return;

    {
      const res = await supabase.from('event_required_items').insert([{
        legacy_id: 'eri_test998',
        event_id: evt.id,
        required_type: 'ref_half',
        display_name: 'レフリー半袖',
        template_key: 'ref_half',
        is_personal_carry: false
      }]);
      console.log('Insert ref_half response:', res.error);
    }
  } catch (e) {
    console.error('Error in insert:', e);
  }
}
testInsert();
