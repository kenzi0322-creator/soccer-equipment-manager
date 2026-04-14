import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  const { data: itemsRaw } = await supabase.from('equipment_items').select('*');
  if (!itemsRaw) return;

  const items = itemsRaw.map(r => ({ code: r.code || '', name: r.name || '' }));

  const prefixes = ['B', 'S', 'T'];
  
  for (const prefix of prefixes) {
    const prefixItems = items.filter(i => i.code.startsWith(prefix));
    prefixItems.sort((a, b) => parseInt(a.code.replace(/\D/g, '') || '0') - parseInt(b.code.replace(/\D/g, '') || '0'));
    
    let currentBagSize = '';
    
    for (const item of prefixItems) {
      if (item.name.includes('レフリー袋')) {
        const match = item.name.match(/レフリー袋（(.*?)）/);
        if (match) {
          currentBagSize = match[1];
        } else {
          currentBagSize = '';
        }
      } else if (currentBagSize && item.name.startsWith('レフリー') && !item.name.includes('（')) {
        if (['レフリー半袖', 'レフリー長袖', 'レフリーパンツ', 'レフリーソックス'].includes(item.name)) {
          console.log(`Renaming: ${item.code} | ${item.name} -> ${item.name}（${currentBagSize}）`);
          item.name = `${item.name}（${currentBagSize}）`;
        }
      }
    }
  }
}

check();
