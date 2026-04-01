import fs from 'fs';
import path from 'path';

type RawItem = {
  item_code: string;
  team: string; // Used to lookup/insert team
  item_name: string;
  role_type: string; // Map to category
  size: string;
  holder: string; // Used to lookup/insert member
  note: string;
};

// Types corresponding to db.ts
type Item = {
  id: string;
  item_code: string;
  name: string;
  category?: string;
  size?: string;
  color?: string;
  owner_team_id: string;
  shared_flag: boolean;
  photo_url?: string;
  current_holder_id: string | null;
  current_holder_type?: string;
  status_note?: string;
  note?: string;
};

type Member = {
  id: string;
  name: string;
  role?: string;
  team_id: string;
  note?: string;
  uniform_number?: string;
  nearest_station?: string;
  has_car?: boolean;
  has_black_pants?: boolean;
  has_black_socks?: boolean;
};

type Team = {
  id: string;
  name: string;
  category?: string;
};

// In this prototype, teams are mostly in mock.ts. We will map common ones:
const TEAM_MAP: Record<string, string> = {
  "文京一般": "t1",
  "都O40": "t2",
  "文京シニア": "t3",
  "TUN共通": "t_tun" // Creating a new ID for TUN共通
};

async function main() {
  const rootDir = process.cwd();
  const rawFilePath = path.join(__dirname, 'initial_items.json');
  const itemsDbPath = path.join(rootDir, 'data.json');
  const membersDbPath = path.join(rootDir, 'members.json');

  if (!fs.existsSync(rawFilePath)) {
    console.error(`File not found: ${rawFilePath}`);
    process.exit(1);
  }

  const rawData: RawItem[] = JSON.parse(fs.readFileSync(rawFilePath, 'utf-8'));
  
  // Load existing data
  let items: Item[] = [];
  if (fs.existsSync(itemsDbPath)) {
    items = JSON.parse(fs.readFileSync(itemsDbPath, 'utf-8'));
  }
  
  let members: Member[] = [];
  if (fs.existsSync(membersDbPath)) {
    members = JSON.parse(fs.readFileSync(membersDbPath, 'utf-8'));
  } else {
    // Fallback to MOCK_MEMBERS if file doesn't exist yet
    members = [
      { id: 'm1', name: '山田 太郎', team_id: 't1', role: 'キャプテン' },
      { id: 'm2', name: '鈴木 一郎', team_id: 't2', role: 'マネージャー' },
      { id: 'm3', name: '佐藤 次郎', team_id: 't3', role: 'メンバー' },
      { id: 'm4', name: '高橋 健太', team_id: 't1', role: 'メンバー' }
    ];
  }

  console.log(`Starting import of ${rawData.length} items to local JSON DB...`);
  let added = 0;
  let updated = 0;

  for (const row of rawData) {
    // 1. Resolve Team ID
    let teamId = TEAM_MAP[row.team];
    if (!teamId) {
      teamId = 't_' + Math.random().toString(36).substr(2, 5);
      TEAM_MAP[row.team] = teamId;
    }

    // 2. Resolve Holder Member
    let holderId: string | null = null;
    if (row.holder) {
      // Find by name
      let existingMember = members.find(m => m.name.includes(row.holder) || row.holder.includes(m.name));
      if (existingMember) {
        holderId = existingMember.id;
      } else {
        // Create new member
        const newMember: Member = {
          id: 'm_' + Date.now() + Math.random().toString(36).substr(2, 4),
          name: row.holder,
          team_id: teamId,
        };
        members.push(newMember);
        holderId = newMember.id;
      }
    }

    // 3. Map Item Data
    const mappedItem: Item = {
      id: '', // Will be assigned later
      item_code: row.item_code,
      name: row.item_name,
      category: row.role_type,
      size: row.size || undefined,
      owner_team_id: teamId,
      shared_flag: true, // Fixed to true for team_shared as requested
      current_holder_id: holderId,
      note: row.note || undefined,
    };

    // 4. Upsert by item_code
    const existingIndex = items.findIndex(i => i.item_code === row.item_code);
    if (existingIndex !== -1) {
      // Update
      mappedItem.id = items[existingIndex].id;
      // Merge properties if needed, here we overwrite entirely
      items[existingIndex] = { ...items[existingIndex], ...mappedItem };
      updated++;
    } else {
      // Insert
      mappedItem.id = 'i_' + Date.now() + Math.random().toString(36).substr(2, 4);
      items.push(mappedItem);
      added++;
    }
  }

  // Save back to JSON files
  fs.writeFileSync(itemsDbPath, JSON.stringify(items, null, 2), 'utf-8');
  fs.writeFileSync(membersDbPath, JSON.stringify(members, null, 2), 'utf-8');

  console.log(`Import completed!`);
  console.log(`- Inserted items: ${added}`);
  console.log(`- Updated items: ${updated}`);
  console.log(`- Members count updated: ${members.length}`);
}

main().catch(console.error);
