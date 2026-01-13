"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, getDate } from 'date-fns';
import { enNZ } from 'date-fns/locale';
import { RRule } from 'rrule';
import { Event, RecurringEvent, DatedEvent } from '@/lib/events';
import Header from '@/components/Header'; // Import the Header component
import { useSearchParams } from 'next/navigation'; // Import useSearchParams

interface EventsPageClientProps {
  allEventsData: Event[];
}

export default function EventsPageClient({ allEventsData }: EventsPageClientProps) {
  const searchParams = useSearchParams(); // Get searchParams from hook
  const today = new Date();
  const currentMonth = searchParams.get('month') ? parseInt(searchParams.get('month')!) - 1 : today.getMonth();
  const currentYear = searchParams.get('year') ? parseInt(searchParams.get('year')!) : today.getFullYear();

  const date = new Date(currentYear, currentMonth);
  const startOfCurrentMonth = startOfMonth(date);
  const endOfCurrentMonth = endOfMonth(date);

  const daysInMonth = eachDayOfInterval({ start: startOfCurrentMonth, end: endOfCurrentMonth });

  // Filter dated events for the current month
  const datedEventsInMonth = allEventsData.filter(event =>
    (event as DatedEvent).startDate && (new Date((event as DatedEvent).startDate).getFullYear() === currentYear && new Date((event as DatedEvent).startDate).getMonth() === currentMonth ||
     (event as DatedEvent).endDate && new Date((event as DatedEvent).endDate).getFullYear() === currentYear && new Date((event as DatedEvent).endDate).getMonth() === currentMonth)
  ) as DatedEvent[];

  // Get recurring events
  const recurringEvents = allEventsData.filter(event => event.type === 'recurring') as RecurringEvent[];

  // Calculate recurring event dates for the current month using RRULE
  const recurringEventDates = useMemo(() => {
    const dateMap = new Map<string, RecurringEvent[]>();

    recurringEvents.forEach(event => {
      if (event.rrule) {
        try {
          // Parse RRULE and get occurrences in the current month
          const rrule = RRule.fromString(`DTSTART:${format(startOfCurrentMonth, 'yyyyMMdd')}T000000Z\nRRULE:${event.rrule}`);
          const occurrences = rrule.between(startOfCurrentMonth, endOfCurrentMonth, true);

          occurrences.forEach(occurrence => {
            const dateKey = format(occurrence, 'yyyy-MM-dd');
            if (!dateMap.has(dateKey)) {
              dateMap.set(dateKey, []);
            }
            dateMap.get(dateKey)!.push(event);
          });
        } catch (error) {
          console.error(`Error parsing RRULE for ${event.slug}:`, error);
        }
      }
    });

    return dateMap;
  }, [recurringEvents, startOfCurrentMonth, endOfCurrentMonth]);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-24">
      <Header /> {/* Render the Header component */}
      <div className="container mx-auto px-4 py-8 text-white">
        <h1 className="text-4xl font-bold text-center mb-12">Upcoming Events Calendar</h1>

        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-8">
          <Link href={`/events?year=${format(subMonths(date, 1), 'yyyy')}&month=${format(subMonths(date, 1), 'MM')}`} className="text-blue-400 hover:text-blue-300">
            &larr; Previous Month
          </Link>
          <h2 className="text-3xl font-semibold">
            {format(date, 'MMMM yyyy', { locale: enNZ })}
          </h2>
          <Link href={`/events?year=${format(addMonths(date, 1), 'yyyy')}&month=${format(addMonths(date, 1), 'MM')}`} className="text-blue-400 hover:text-blue-300">
            Next Month &rarr;
          </Link>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 border border-gray-700 rounded-lg overflow-hidden">
          {/* Days of Week Headers */}
          {daysOfWeek.map(day => (
            <div key={day} className="bg-gray-800 p-2 text-center font-medium text-sm">
              {day}
            </div>
          ))}

          {/* Empty cells for days before the 1st of the month */}
          {Array.from({ length: startOfCurrentMonth.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white/5 p-2 min-h-[100px] border-t border-gray-700"></div>
          ))}

          {/* Days with Events */}
          {daysInMonth.map(day => {
            const eventsOnThisDay: Event[] = [];
            const dateKey = format(day, 'yyyy-MM-dd');

            // Add dated events
            datedEventsInMonth.forEach(event => {
              if (isSameDay(new Date(event.startDate), day) || (new Date(event.startDate) <= day && new Date(event.endDate) >= day)) {
                eventsOnThisDay.push(event);
              }
            });

            // Add recurring events from RRULE calculations
            const recurringEventsOnDay = recurringEventDates.get(dateKey);
            if (recurringEventsOnDay) {
              eventsOnThisDay.push(...recurringEventsOnDay);
            }

            return (
              <div key={format(day, 'yyyy-MM-dd')} className={`bg-white/5 p-2 min-h-[100px] border-t border-gray-700 ${isSameDay(day, today) ? 'border-2 border-blue-500' : ''}`}>
                <p className="text-sm font-medium mb-1">{format(day, 'd')}</p>
                <div className="space-y-1">
                  {eventsOnThisDay.map(event => (
                    <Link key={event.slug} href={`/events/${event.slug}`} className="block">
                      <div className="bg-blue-600 text-white text-xs p-1 rounded hover:bg-blue-500 transition-colors duration-200">
                        {event.title}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
