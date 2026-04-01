import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function readJson(filename: string) {
  try {
    const data = await fs.readFile(path.join(process.cwd(), filename), 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.warn(`File not found or invalid: ${filename}`);
    return [];
  }
}

async function seed() {
  console.log('Starting seed...');

  const teams = await readJson('teams.json');
  const venues = await readJson('venues.json');
  const members = await readJson('members.json');
  const events = await readJson('events.json');
  const items = await readJson('data.json');
  const eris = await readJson('event_required_items.json');
  const participants = await readJson('event_participants.json');
  const handoffs = await readJson('handoffs.json');

  // 1. Teams
  for (const t of teams) {
    await prisma.team.upsert({
      where: { id: t.id },
      update: {},
      create: { id: t.id, name: t.name, category: t.category }
    });
  }
  console.log(`Seeded ${teams.length} teams`);

  // 2. Venues
  for (const v of venues) {
    await prisma.venue.upsert({
      where: { id: v.id },
      update: {},
      create: {
        id: v.id,
        name: v.name,
        address: v.address,
        parking_note: v.parking_note,
        handoff_note: v.handoff_note,
        meeting_note: v.meeting_note,
        difficulty_note: v.difficulty_note
      }
    });
  }
  console.log(`Seeded ${venues.length} venues`);

  // 3. Members
  for (const m of members) {
    await prisma.member.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        name: m.name,
        role: m.role,
        team_id: m.team_id,
        note: m.note,
        uniform_number: m.uniform_number,
        nearest_station: m.nearest_station,
        has_car: !!m.has_car,
        has_black_pants: !!m.has_black_pants,
        has_black_socks: !!m.has_black_socks
      }
    });
  }
  console.log(`Seeded ${members.length} members`);

  // 4. Events
  for (const e of events) {
    await prisma.event.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
        title: e.title,
        date: e.date,
        start_at: e.start_at,
        end_at: e.end_at,
        venue_id: e.venue_id || 'v1', // Fallback to v1 if missing
        primary_team_id: e.primary_team_id || 't1',
        is_joint_match: !!e.is_joint_match,
        referee_time: e.referee_time,
        main_referee_id: e.main_referee_id,
        sub_referee_id: e.sub_referee_id,
        note: e.note
      }
    });
  }
  console.log(`Seeded ${events.length} events`);

  // 5. Items
  for (const i of items) {
    await prisma.item.upsert({
      where: { id: i.id },
      update: {},
      create: {
        id: i.id,
        item_code: i.item_code,
        name: i.name,
        category: i.category,
        size: i.size,
        color: i.color,
        owner_team_id: i.owner_team_id || 't1',
        shared_flag: !!i.shared_flag,
        photo_url: i.photo_url,
        current_holder_id: i.current_holder_id,
        current_holder_type: i.current_holder_type,
        status_note: i.status_note,
        note: i.note
      }
    });
  }
  console.log(`Seeded ${items.length} items`);

  // 6. ERI
  for (const eri of eris) {
    await prisma.eventRequiredItem.upsert({
      where: { id: eri.id },
      update: {},
      create: {
        id: eri.id,
        event_id: eri.event_id,
        item_id: eri.item_id,
        required_flag: !!eri.required_flag,
        assigned_member_id: eri.assigned_member_id,
        assignment_status: eri.assignment_status || 'unassigned',
        is_personal_item: !!eri.is_personal_item,
        note: eri.note
      }
    });
  }
  console.log(`Seeded ${eris.length} required items`);

  // 7. Participants
  for (const p of participants) {
    await prisma.eventParticipant.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        event_id: p.event_id,
        member_id: p.member_id,
        attendance_status: p.attendance_status || 'pending',
        updated_at: p.updated_at ? new Date(p.updated_at) : new Date()
      }
    });
  }
  console.log(`Seeded ${participants.length} participants`);

  // 8. Handoffs
  for (const h of handoffs) {
    await prisma.handoff.upsert({
      where: { id: h.id },
      update: {},
      create: {
        id: h.id,
        item_id: h.item_id,
        from_member_id: h.from_member_id,
        to_member_id: h.to_member_id,
        source_event_id: h.source_event_id,
        target_event_id: h.target_event_id,
        venue_id: h.venue_id,
        handoff_start_at: h.handoff_start_at ? new Date(h.handoff_start_at) : null,
        handoff_end_at: h.handoff_end_at ? new Date(h.handoff_end_at) : null,
        receive_deadline_at: h.receive_deadline_at ? new Date(h.receive_deadline_at) : null,
        status: h.status || 'pending',
        note: h.note
      }
    });
  }
  console.log(`Seeded ${handoffs.length} handoffs`);

  console.log('Seed completed successfully!');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
