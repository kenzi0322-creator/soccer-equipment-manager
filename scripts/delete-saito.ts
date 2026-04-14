import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function findAndDeleteSaito() {
  const { data: members, error } = await supabase.from('members').select('*').like('display_name', '%斉藤%');
  if (error) {
    console.error('Error fetching members:', error);
    return;
  }
  
  const target = members?.find(m => m.display_name === '斉藤' || !m.jersey_number);
  
  if (target) {
    console.log('Found target member:', target);
    const { error: delError } = await supabase.from('members').delete().eq('id', target.id);
    if (delError) {
      console.error('Failed to delete:', delError);
    } else {
      console.log('Successfully deleted member:', target.display_name);
    }
  } else {
    console.log('Saito not found or matches multiple', members);
  }
}

findAndDeleteSaito();
