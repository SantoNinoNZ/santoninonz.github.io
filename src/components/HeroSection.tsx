"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Event, RecurringEvent, DatedEvent } from '@/lib/events'; // Only import types

interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  imageUrl?: string;
  contentHtml?: string;
}

interface HeroSectionProps {
  latestPost: Post | null;
  upcomingEvents: Event[]; // Add upcomingEvents prop
}

function isRecurringEvent(event: Event): event is RecurringEvent {
  return event.type === 'recurring';
}

function isDatedEvent(event: Event): event is DatedEvent {
  return event.type === 'dated';
}

const HeroSection: React.FC<HeroSectionProps> = ({ latestPost, upcomingEvents }) => {
  const [currentNZDate, setCurrentNZDate] = useState<string>("");

  useEffect(() => {
    const nzTimeZone = 'Pacific/Auckland';
    const now = new Date();
    const displayDate = new Intl.DateTimeFormat('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' }).format(now);
    setCurrentNZDate(displayDate);
  }, []);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Content Overlay */}
      <div className="relative z-10 w-full max-w-screen-xl px-4 py-8 sm:py-12 flex flex-col text-white">
        {/* Date */}
        <div className="text-lg font-bold text-right mb-4 ml-auto pt-4">
          <p>{currentNZDate}</p>
        </div>

        {/* Latest Post - Full Width */}
        <div className="relative group bg-white/10 p-6 sm:p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 mb-8">
          <h3 className="text-2xl sm:text-3xl font-lora font-bold mb-4 sm:mb-6">Latest Post</h3>
          {latestPost && (
            <Link href={`/posts/${latestPost.slug}`} className="block">
              <h4 className="text-2xl sm:text-3xl font-bold group-hover:text-gray-300 transition-colors duration-300 mb-3">{latestPost.title}</h4>
              <p className="text-gray-200 text-base mb-4">{new Date(latestPost.date.split('/').reverse().join('-')).toLocaleString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-gray-100 text-lg leading-relaxed">{latestPost.excerpt || `Click to read more...`}</p>
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg"></div>
            </Link>
          )}
        </div>

        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <div className="mt-8 bg-white/10 p-4 sm:p-6 rounded-lg shadow-lg">
            <h3 className="text-xl sm:text-2xl font-lora font-bold mb-2 sm:mb-4 text-white">Upcoming Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.map((event) => (
                <Link key={event.slug} href={`/events/${event.slug}`} className="block group">
                  <div className="bg-white/5 p-4 rounded-md hover:bg-white/10 transition-colors duration-300">
                    <h4 className="text-xl font-semibold mb-1 text-white group-hover:text-gray-300">
                      {event.title}
                    </h4>
                    {isRecurringEvent(event) && (
                      <p className="text-gray-300 text-sm">
                        {event.recurrence} at {event.time}
                      </p>
                    )}
                    {isDatedEvent(event) && (
                      <p className="text-gray-300 text-sm">
                        {format(new Date(event.startDate), 'MMM dd, yyyy')} - {format(new Date(event.endDate), 'MMM dd, yyyy')}
                      </p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">
                      {event.venue}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href="/events" className="text-blue-400 hover:text-blue-300 transition-colors duration-300 font-medium">
                View All Events &rarr;
              </Link>
            </div>
          </div>
        )}
      </div> {/* Closing div for max-w-screen-xl container */}
    </div>
  );
};

export default HeroSection;
