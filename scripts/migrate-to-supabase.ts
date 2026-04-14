/**
 * Supabase 初期データ移行スクリプト（スキーマ整合版 + source_type 修正）
 *
 * 実行方法:
 *   npx tsx scripts/migrate-to-supabase.ts
 *
 * 必要な環境変数（.env.local）:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← service_role キー（RLS バイパス用）
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// ── 接続 ──────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を .env.local に設定してください')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

const DATA_DIR = process.cwd()

// ── 変換マスタ ────────────────────────────────────────────────────────────────

const TEAM_CATEGORY_MAP: Record<string, string> = {
  t1:    'general',
  t2:    'o40',
  t3:    'senior',
  t_tun: 'shared',
}

// テンプレート品目の定義（equipment_items には入れない）
// source_type は DB 制約に従い常に 'standard'
// template か実在備品かは template_key / selected_equipment_item_id の有無で区別する
const TEMPLATE_DEFS: Record<string, { template_key: string; required_type: string; display_name: string }> = {
  // ボール・GK
  i_gk_template:          { template_key: 'gk',          required_type: 'gk',          display_name: 'GKユニ'           },
  i_match_ball_template:  { template_key: 'match_ball',  required_type: 'match_ball',  display_name: '試合球'           },
  i_warmup_ball_template: { template_key: 'warmup_ball', required_type: 'warmup_ball', display_name: 'アップ球'         },
  // レフリー系
  i_ref_half_template:    { template_key: 'ref_half',    required_type: 'ref_half',    display_name: 'レフリー半袖'     },
  i_ref_long_template:    { template_key: 'ref_long',    required_type: 'ref_long',    display_name: 'レフリー長袖'     },
  i_ref_pants_template:   { template_key: 'ref_pants',   required_type: 'ref_pants',   display_name: 'レフリーパンツ'   },
  i_ref_socks_template:   { template_key: 'ref_socks',   required_type: 'ref_socks',   display_name: 'レフリーソックス' },
  i_ref_flags_template:   { template_key: 'ref_flags',   required_type: 'ref_flags',   display_name: '副審フラッグ'     },
  i_ref_gear_template:    { template_key: 'ref_gear',    required_type: 'ref_gear',    display_name: 'レフリー用具セット'},
}

const TEMPLATE_IDS = new Set(Object.keys(TEMPLATE_DEFS))

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function readJson<T>(filename: string): T {
  const filepath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filepath)) {
    throw new Error(`JSON ファイルが見つかりません: ${filepath}`)
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf-8')) as T
}

function nullable(val: string | undefined | null): string | null {
  if (val == null || val.trim() === '') return null
  return val
}

function toTeamCategory(teamId: string | undefined | null): string | null {
  if (!teamId || teamId.trim() === '') return null
  const cat = TEAM_CATEGORY_MAP[teamId]
  if (!cat) {
    console.warn(`  ⚠️  未知の team_id: "${teamId}" → null`)
    return null
  }
  return cat
}

async function fetchLegacyMap(table: string): Promise<Record<string, string>> {
  const { data, error } = await supabase.from(table).select('id, legacy_id')
  if (error) throw new Error(`${table} の legacy_id マップ取得失敗: ${error.message}`)
  return Object.fromEntries((data ?? []).map((r: any) => [r.legacy_id, r.id]))
}

/** equipment_items の legacy_id → { id, name } マップ（display_name 解決用）*/
async function fetchItemDetailMap(): Promise<Record<string, { id: string; name: string }>> {
  const { data, error } = await supabase.from('equipment_items').select('id, legacy_id, name')
  if (error) throw new Error(`equipment_items 詳細取得失敗: ${error.message}`)
  return Object.fromEntries(
    (data ?? []).map((r: any) => [r.legacy_id, { id: r.id as string, name: r.name as string }])
  )
}

// ── 1. members ────────────────────────────────────────────────────────────────

async function migrateMembers() {
  console.log('\n📋 [1/4] members を移行中...')

  const raw = readJson<any[]>('members.json')

  const rows = raw.map(m => ({
    legacy_id:       m.id,
    display_name:    m.name,
    jersey_number:   nullable(m.uniform_number),
    team_category:   toTeamCategory(m.team_id),
    role:            nullable(m.role),
    nearest_station: nullable(m.nearest_station),
    has_car:         m.has_car ?? false,
    note:            nullable(m.note),
  }))

  const { error } = await supabase
    .from('members')
    .upsert(rows, { onConflict: 'legacy_id' })

  if (error) throw new Error(`members upsert 失敗: ${error.message}`)
  console.log(`  ✅ ${rows.length} 件 upsert 完了`)
}

// ── 2. equipment_items ────────────────────────────────────────────────────────

async function migrateEquipmentItems() {
  console.log('\n🎽 [2/4] equipment_items を移行中...')

  const raw = readJson<any[]>('data.json')
  const memberMap = await fetchLegacyMap('members')

  let unresolvedHolders = 0

  const rows = raw.map(item => {
    const holderUuid = item.current_holder_id
      ? (memberMap[item.current_holder_id] ?? null)
      : null

    if (item.current_holder_id && !holderUuid) {
      console.warn(`  ⚠️  holder 未解決: "${item.current_holder_id}" (code: ${item.item_code})`)
      unresolvedHolders++
    }

    const teamCat = toTeamCategory(item.owner_team_id)

    return {
      legacy_id:                item.id,
      code:                     item.item_code,
      display_label:            item.name,
      name:                     item.name,
      item_category:            item.category,
      team_category:            teamCat,
      owner_team_category:      teamCat,
      current_holder_member_id: holderUuid,
      note:                     nullable(item.note),
    }
  })

  const { error } = await supabase
    .from('equipment_items')
    .upsert(rows, { onConflict: 'legacy_id' })

  if (error) throw new Error(`equipment_items upsert 失敗: ${error.message}`)
  console.log(
    `  ✅ ${rows.length} 件 upsert 完了` +
    (unresolvedHolders > 0 ? `（holder 未解決: ${unresolvedHolders} 件）` : '')
  )
}

// ── 3. events ─────────────────────────────────────────────────────────────────

async function migrateEvents() {
  console.log('\n📅 [3/4] events を移行中...')

  const raw = readJson<any[]>('events.json')

  const rows = raw.map(e => {
    const teamCat = toTeamCategory(e.primary_team_id)

    return {
      legacy_id:             e.id,
      external_id:           e.id,
      title:                 e.title,
      event_date:            e.date,
      start_at:              nullable(e.start_at),
      end_at:                nullable(e.end_at),
      note:                  nullable(e.note),
      venue_legacy_id:       nullable(e.venue_id),
      team_category:         teamCat,
      primary_team_category: teamCat,
      is_official:           typeof e.title === 'string' && e.title.includes('公式戦'),
      // DB に存在しない列は除外:
      // description, is_joint_match, sync_status, venue_name, status
    }
  })

  const { error } = await supabase
    .from('events')
    .upsert(rows, { onConflict: 'legacy_id' })

  if (error) throw new Error(`events upsert 失敗: ${error.message}`)
  console.log(`  ✅ ${rows.length} 件 upsert 完了`)
}

// ── 4. event_required_items ───────────────────────────────────────────────────
// source_type は DB 制約 event_required_items_source_type_check により
// 'manual' か 'standard' のみ許可 → 全件 'standard' で統一
// template か実在備品かは以下で区別:
//   テンプレート → template_key に値あり、selected_equipment_item_id は null
//   実在備品    → template_key は null、selected_equipment_item_id に UUID

async function migrateEventRequiredItems() {
  console.log('\n📦 [4/4] event_required_items を移行中...')

  const raw = readJson<any[]>('event_required_items.json')

  const [eventMap, memberMap, itemDetailMap] = await Promise.all([
    fetchLegacyMap('events'),
    fetchLegacyMap('members'),
    fetchItemDetailMap(),
  ])

  let unresolvedEvents = 0
  let unresolvedItems  = 0
  let templateCount    = 0
  let realCount        = 0

  const rows = raw.map((eri, idx) => {
    const isTemplate = TEMPLATE_IDS.has(eri.item_id)
    isTemplate ? templateCount++ : realCount++

    const eventUuid = eventMap[eri.event_id] ?? null
    if (!eventUuid) {
      console.warn(`  ⚠️  event_id 未解決: "${eri.event_id}" (id: ${eri.id})`)
      unresolvedEvents++
    }

    const assigneeUuid = eri.assigned_member_id
      ? (memberMap[eri.assigned_member_id] ?? null)
      : null

    if (isTemplate) {
      const def = TEMPLATE_DEFS[eri.item_id]
      return {
        legacy_id:                  eri.id,
        event_id:                   eventUuid,
        source_type:                'standard',      // DB 制約: 'manual' | 'standard'
        template_key:               def.template_key,
        required_type:              def.required_type,
        display_name:               def.display_name,
        selected_equipment_item_id: null,
        assignee_member_id:         assigneeUuid,
        quantity:                   1,
        is_personal_carry:          false,
        sort_order:                 idx + 1,
      }
    } else {
      const itemDetail = itemDetailMap[eri.item_id] ?? null
      if (!itemDetail) {
        console.warn(`  ⚠️  item_id 未解決: "${eri.item_id}" (id: ${eri.id})`)
        unresolvedItems++
      }

      return {
        legacy_id:                  eri.id,
        event_id:                   eventUuid,
        source_type:                'standard',      // DB 制約: 'manual' | 'standard'
        template_key:               null,
        required_type:              'item',
        display_name:               itemDetail?.name ?? eri.item_id,
        selected_equipment_item_id: itemDetail?.id ?? null,
        assignee_member_id:         assigneeUuid,
        quantity:                   1,
        is_personal_carry:          false,
        sort_order:                 idx + 1,
      }
    }
  })

  const { error } = await supabase
    .from('event_required_items')
    .upsert(rows, { onConflict: 'legacy_id' })

  if (error) throw new Error(`event_required_items upsert 失敗: ${error.message}`)

  console.log(`  ✅ ${rows.length} 件 upsert 完了（実備品: ${realCount} / テンプレート: ${templateCount}）`)
  if (unresolvedEvents > 0) console.warn(`  ⚠️  event_id 未解決: ${unresolvedEvents} 件`)
  if (unresolvedItems  > 0) console.warn(`  ⚠️  item_id 未解決: ${unresolvedItems} 件`)
}

// ── メイン ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Supabase 移行スクリプト開始')
  console.log(`   URL:      ${SUPABASE_URL}`)
  console.log(`   DATA_DIR: ${DATA_DIR}`)

  try {
    await migrateMembers()
    await migrateEquipmentItems()
    await migrateEvents()
    await migrateEventRequiredItems()

    console.log('\n🎉 全テーブルの移行が完了しました！')
    console.log('   Supabase Table Editor で件数を確認してください。')
  } catch (err) {
    console.error('\n❌ 移行中にエラーが発生しました:', err)
    process.exit(1)
  }
}

main()