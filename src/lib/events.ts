import { remark } from 'remark';
import html from 'remark-html';
import { isPast, isToday, parse, isBefore, isAfter, startOfDay } from 'date-fns';
import { supabase } from './supabase';

export interface RecurringEvent {
  slug: string;
  title: string;
  type: 'recurring';
  recurrence: string;
  time: string;
  rrule?: string;
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

/**
 * Convert markdown content to HTML
 */
async function processMarkdown(content: string): Promise<string> {
  const processedContent = await remark().use(html).process(content);
  return processedContent.toString();
}

/**
 * Fetch events from Supabase and format them
 */
export async function getSortedEventsData(): Promise<Event[]> {
  if (!supabase) {
    console.warn('Supabase client not initialized. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
    return [];
  }

  try {
    // Fetch published events with their days from Supabase
    const { data: eventsData, error } = await supabase
      .from('events')
      .select(`
        *,
        days:event_days(
          id,
          day_number,
          date,
          choir,
          sponsors_pilgrims,
          area_coordinators
        )
      `)
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events from Supabase:', error);
      return [];
    }

    if (!eventsData) {
      return [];
    }

    const today = startOfDay(new Date());

    // Transform and filter events
    const transformedEvents: Event[] = await Promise.all(
      eventsData.map(async (eventData: any) => {
        // Process markdown content to HTML
        const contentHtml = eventData.content
          ? await processMarkdown(eventData.content)
          : undefined;

        if (eventData.type === 'recurring') {
          return {
            slug: eventData.slug,
            title: eventData.title,
            type: 'recurring',
            recurrence: eventData.recurrence,
            time: eventData.time,
            rrule: eventData.rrule,
            venue: eventData.venue,
            address: eventData.address,
            contentHtml,
          } as RecurringEvent;
        } else {
          // Transform snake_case to camelCase for days
          const days: DatedEventDay[] = (eventData.days || [])
            .map((day: any) => ({
              dayNumber: day.day_number,
              date: day.date,
              choir: day.choir,
              sponsorsPilgrims: day.sponsors_pilgrims,
              areaCoordinators: day.area_coordinators,
            }))
            .sort((a: DatedEventDay, b: DatedEventDay) => a.dayNumber - b.dayNumber);

          return {
            slug: eventData.slug,
            title: eventData.title,
            type: 'dated',
            startDate: eventData.start_date,
            endDate: eventData.end_date,
            venue: eventData.venue,
            address: eventData.address,
            rosaryTime: eventData.rosary_time,
            days,
            parkingInfo: eventData.parking_info,
            contentHtml,
          } as DatedEvent;
        }
      })
    );

    // Filter out past dated events
    const filteredEvents = transformedEvents.filter(event => {
      if (isDatedEvent(event)) {
        // Parse dates with the format used in database (e.g., "January 9, 2026")
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
  } catch (error) {
    console.error('Unexpected error fetching events:', error);
    return [];
  }
}

/**
 * Fetch a single event by slug from Supabase
 */
export async function getEventData(slug: string): Promise<Event> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data: eventData, error } = await supabase
    .from('events')
    .select(`
      *,
      days:event_days(
        id,
        day_number,
        date,
        choir,
        sponsors_pilgrims,
        area_coordinators
      )
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error) {
    throw new Error(`Failed to fetch event: ${error.message}`);
  }

  if (!eventData) {
    throw new Error(`Event not found: ${slug}`);
  }

  // Process markdown content to HTML
  const contentHtml = eventData.content
    ? await processMarkdown(eventData.content)
    : undefined;

  if (eventData.type === 'recurring') {
    return {
      slug: eventData.slug,
      title: eventData.title,
      type: 'recurring',
      recurrence: eventData.recurrence,
      time: eventData.time,
      rrule: eventData.rrule,
      venue: eventData.venue,
      address: eventData.address,
      contentHtml,
    } as RecurringEvent;
  } else {
    // Transform snake_case to camelCase for days
    const days: DatedEventDay[] = (eventData.days || [])
      .map((day: any) => ({
        dayNumber: day.day_number,
        date: day.date,
        choir: day.choir,
        sponsorsPilgrims: day.sponsors_pilgrims,
        areaCoordinators: day.area_coordinators,
      }))
      .sort((a: DatedEventDay, b: DatedEventDay) => a.dayNumber - b.dayNumber);

    return {
      slug: eventData.slug,
      title: eventData.title,
      type: 'dated',
      startDate: eventData.start_date,
      endDate: eventData.end_date,
      venue: eventData.venue,
      address: eventData.address,
      rosaryTime: eventData.rosary_time,
      days,
      parkingInfo: eventData.parking_info,
      contentHtml,
    } as DatedEvent;
  }
}
