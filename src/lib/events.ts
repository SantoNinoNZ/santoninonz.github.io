import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { remark } from 'remark';
import html from 'remark-html';
import { isPast, isToday, parse, isBefore, isAfter, startOfDay } from 'date-fns';

export interface RecurringEvent {
  slug: string;
  title: string;
  type: 'recurring';
  recurrence: string;
  time: string;
  venue: string;
  address: string;
  contentHtml?: string;
}

export interface DatedEventDay {
  dayNumber: number;
  date: string;
  choir: string;
  sponsorsPilgrims: string;
  areaCoordinators: string;
}

export interface DatedEvent {
  slug: string;
  title: string;
  type: 'dated';
  startDate: string;
  endDate: string;
  venue: string;
  address: string;
  rosaryTime?: string;
  days: DatedEventDay[];
  parkingInfo?: string;
  contentHtml?: string;
}

export type Event = RecurringEvent | DatedEvent;

export function isRecurringEvent(event: Event): event is RecurringEvent {
  return event.type === 'recurring';
}

export function isDatedEvent(event: Event): event is DatedEvent {
  return event.type === 'dated';
}

export async function getSortedEventsData(): Promise<Event[]> {
  const indexPath = path.join(process.cwd(), 'public', 'events-index.yaml');
  const fileContent = await fs.readFile(indexPath, 'utf8');
  const allEventsData: Event[] = yaml.load(fileContent) as Event[];

  const today = startOfDay(new Date());

  // Filter out past dated events (keep events that are current or upcoming)
  const filteredEvents = allEventsData.filter(event => {
    if (isDatedEvent(event)) {
      // Parse dates with the format used in YAML (e.g., "January 9, 2026")
      const endDate = startOfDay(parse(event.endDate, 'MMMM d, yyyy', new Date()));

      // Keep events that haven't ended yet (endDate is today or in the future)
      return !isBefore(endDate, today);
    }
    return true; // Keep all recurring events
  });

  // Sort events: recurring events first, then dated events by start date (current/soonest first)
  return filteredEvents.sort((a, b) => {
    if (isRecurringEvent(a) && !isRecurringEvent(b)) return -1;
    if (!isRecurringEvent(a) && isRecurringEvent(b)) return 1;
    if (isDatedEvent(a) && isDatedEvent(b)) {
      const aStart = parse(a.startDate, 'MMMM d, yyyy', new Date());
      const bStart = parse(b.startDate, 'MMMM d, yyyy', new Date());
      return aStart.getTime() - bStart.getTime();
    }
    return 0;
  });
}

export async function getEventData(slug: string): Promise<Event> {
  const fullPath = path.join(process.cwd(), 'public', 'events', `${slug}.md`);
  const fileContents = await fs.readFile(fullPath, 'utf8');

  const parts = fileContents.split('---');
  const frontMatter = yaml.load(parts[1]) as Omit<Event, 'contentHtml' | 'slug'>;
  const content = parts.slice(2).join('---');

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    contentHtml,
    ...frontMatter,
  } as Event;
}
