import { Event, Venue } from '@/types';

export function getEstimatedVenue(event: Event, venues: Venue[]) {
  const isSampleVenue = event.venue_id === 'v1';
  if (!event.venue_id || isSampleVenue) {
    const textToSearch = `${event.title} ${event.note || ''}`;
    // Find the first venue name that is mentioned in title or note (excluding sample v1)
    return venues.find(v => v.id !== 'v1' && textToSearch.includes(v.name));
  }
  return null;
}
