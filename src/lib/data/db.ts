import fs from 'fs/promises';
import path from 'path';
import { Item, Event, EventRequiredItem, Team, Venue, Handoff, EventParticipant, Member } from '@/types';

const DB_PATH = path.join(process.cwd(), 'data.json');
const EVENTS_DB_PATH = path.join(process.cwd(), 'events.json');
const ERI_DB_PATH = path.join(process.cwd(), 'event_required_items.json');
const MEMBERS_DB_PATH = path.join(process.cwd(), 'members.json');
const TEAMS_DB_PATH = path.join(process.cwd(), 'teams.json');
const VENUES_DB_PATH = path.join(process.cwd(), 'venues.json');
const HANDOFFS_DB_PATH = path.join(process.cwd(), 'handoffs.json');
const PARTICIPANTS_DB_PATH = path.join(process.cwd(), 'event_participants.json');

// Initialize DB file if it doesn't exist (Only works in local, fails gracefully in prod)
async function initFile(filePath: string, defaultData: any = []) {
  try {
    await fs.access(filePath);
  } catch {
    try {
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    } catch (e) {
      console.warn(`Could not initialize ${filePath}:`, e);
    }
  }
}

// ========================
// Items Persistence
// ========================
export async function getItems(): Promise<Item[]> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data) as Item[];
  } catch {
    return [];
  }
}

export async function getItem(id: string): Promise<Item | undefined> {
  const items = await getItems();
  return items.find(i => i.id === id);
}

export async function saveItems(items: Item[]): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(items, null, 2), 'utf-8');
}

export async function saveItem(item: Item): Promise<void> {
  const items = await getItems();
  items.push(item);
  await saveItems(items);
}

export async function updateItemInDb(item: Item): Promise<void> {
  const items = await getItems();
  const index = items.findIndex(i => i.id === item.id);
  if (index !== -1) {
    items[index] = item;
    await saveItems(items);
  }
}

export async function saveItemsBulk(newItems: Item[]): Promise<void> {
  const items = await getItems();
  await saveItems([...items, ...newItems]);
}

// ========================
// Events Persistence
// ========================
export async function getEvents(): Promise<Event[]> {
  try {
    const data = await fs.readFile(EVENTS_DB_PATH, 'utf-8');
    return JSON.parse(data) as Event[];
  } catch {
    return [];
  }
}

export async function getEvent(id: string): Promise<Event | undefined> {
  const events = await getEvents();
  return events.find(e => e.id === id);
}

export async function saveEvents(events: Event[]): Promise<void> {
  await fs.writeFile(EVENTS_DB_PATH, JSON.stringify(events, null, 2), 'utf-8');
}

// ========================
// Event Required Items Persistence
// ========================
export async function getEventRequiredItems(): Promise<EventRequiredItem[]> {
  try {
    const data = await fs.readFile(ERI_DB_PATH, 'utf-8');
    return JSON.parse(data) as EventRequiredItem[];
  } catch {
    return [];
  }
}

export async function saveEventRequiredItems(items: EventRequiredItem[]): Promise<void> {
  await fs.writeFile(ERI_DB_PATH, JSON.stringify(items, null, 2), 'utf-8');
}

// ========================
// Members Persistence
// ========================
export async function getMembers(): Promise<Member[]> {
  try {
    const data = await fs.readFile(MEMBERS_DB_PATH, 'utf-8');
    return JSON.parse(data) as Member[];
  } catch {
    return [];
  }
}

export async function saveMembers(members: Member[]): Promise<void> {
  await fs.writeFile(MEMBERS_DB_PATH, JSON.stringify(members, null, 2), 'utf-8');
}

// ========================
// Teams Persistence
// ========================
export async function getTeams(): Promise<Team[]> {
  try {
    const data = await fs.readFile(TEAMS_DB_PATH, 'utf-8');
    return JSON.parse(data) as Team[];
  } catch {
    return [];
  }
}

// ========================
// Venues Persistence
// ========================
export async function getVenues(): Promise<Venue[]> {
  try {
    const data = await fs.readFile(VENUES_DB_PATH, 'utf-8');
    return JSON.parse(data) as Venue[];
  } catch {
    return [];
  }
}

// ========================
// Handoffs Persistence
// ========================
export async function getHandoffs(): Promise<Handoff[]> {
  try {
    const data = await fs.readFile(HANDOFFS_DB_PATH, 'utf-8');
    return JSON.parse(data) as Handoff[];
  } catch {
    return [];
  }
}

// ========================
// Event Participants Persistence
// ========================
export async function getEventParticipants(): Promise<EventParticipant[]> {
  try {
    const data = await fs.readFile(PARTICIPANTS_DB_PATH, 'utf-8');
    return JSON.parse(data) as EventParticipant[];
  } catch {
    return [];
  }
}
