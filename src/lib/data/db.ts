import fs from 'fs/promises';
import path from 'path';
import { Item, Event, EventRequiredItem } from '@/types';
import { MOCK_ITEMS, MOCK_EVENTS, MOCK_EVENT_REQUIRED_ITEMS } from './mock'; // fallback initial data

const DB_PATH = path.join(process.cwd(), 'data.json');
const EVENTS_DB_PATH = path.join(process.cwd(), 'events.json');
const ERI_DB_PATH = path.join(process.cwd(), 'event_required_items.json');
const MEMBERS_DB_PATH = path.join(process.cwd(), 'members.json');

// Initialize DB file with mock data if it doesn't exist
async function initDb() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(MOCK_ITEMS, null, 2), 'utf-8');
  }
}

export async function getItems(): Promise<Item[]> {
  await initDb();
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(data) as Item[];
}

export async function getItem(id: string): Promise<Item | undefined> {
  const items = await getItems();
  return items.find(i => i.id === id);
}

export async function saveItem(newItem: Item): Promise<void> {
  const items = await getItems();
  items.push(newItem);
  await fs.writeFile(DB_PATH, JSON.stringify(items, null, 2), 'utf-8');
}

export async function updateItemInDb(updatedItem: Item): Promise<void> {
  const items = await getItems();
  const index = items.findIndex(i => i.id === updatedItem.id);
  if (index !== -1) {
    items[index] = updatedItem;
    await fs.writeFile(DB_PATH, JSON.stringify(items, null, 2), 'utf-8');
  }
}

// ========================
// Events Persistence
// ========================
async function initEventsDb() {
  try {
    await fs.access(EVENTS_DB_PATH);
  } catch {
    await fs.writeFile(EVENTS_DB_PATH, JSON.stringify(MOCK_EVENTS, null, 2), 'utf-8');
  }
}

export async function getEvents(): Promise<Event[]> {
  await initEventsDb();
  const data = await fs.readFile(EVENTS_DB_PATH, 'utf-8');
  return JSON.parse(data) as Event[];
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
async function initEriDb() {
  try {
    await fs.access(ERI_DB_PATH);
  } catch {
    await fs.writeFile(ERI_DB_PATH, JSON.stringify(MOCK_EVENT_REQUIRED_ITEMS, null, 2), 'utf-8');
  }
}

export async function getEventRequiredItems(): Promise<EventRequiredItem[]> {
  await initEriDb();
  const data = await fs.readFile(ERI_DB_PATH, 'utf-8');
  return JSON.parse(data) as EventRequiredItem[];
}

export async function saveEventRequiredItems(items: EventRequiredItem[]): Promise<void> {
  await fs.writeFile(ERI_DB_PATH, JSON.stringify(items, null, 2), 'utf-8');
}

// ========================
// Members Persistence
// ========================
import { Member } from '@/types';
// Note: members.json is expected to be placed by an initial script.
export async function getMembers(): Promise<Member[]> {
  try {
    const data = await fs.readFile(MEMBERS_DB_PATH, 'utf-8');
    return JSON.parse(data) as Member[];
  } catch (e) {
    // Return empty array if the file somehow doesn't exist
    return [];
  }
}

export async function saveMembers(members: Member[]): Promise<void> {
  await fs.writeFile(MEMBERS_DB_PATH, JSON.stringify(members, null, 2), 'utf-8');
}
