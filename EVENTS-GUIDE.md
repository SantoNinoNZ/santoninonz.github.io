# Events System Guide

This guide explains how to create and manage events in the Santo Nino NZ website.

## Table of Contents

1. [System Overview](#system-overview)
2. [Event Types](#event-types)
3. [Creating a New Event](#creating-a-new-event)
4. [File Structure](#file-structure)
5. [Common Pitfalls](#common-pitfalls)
6. [Examples](#examples)

## System Overview

The events system consists of two main components:

1. **events-index.yaml** - Contains event metadata for quick loading and filtering
2. **events/*.md** - Individual markdown files with detailed event information

Events appear in multiple places:
- Events calendar page (`/events`)
- Individual event detail pages (`/events/[slug]`)
- Homepage hero section (upcoming events)

## Event Types

There are two types of events:

### 1. Recurring Events

Events that happen on a regular schedule (e.g., "Every First Friday", "Every Third Sunday").

**Required Fields:**
- `slug` - Unique identifier (kebab-case)
- `title` - Event name
- `type: recurring`
- `recurrence` - Pattern description (e.g., "Every First and Third Friday of the Month")
- `time` - Event time (e.g., "7:30 PM")
- `venue` - Location name
- `address` - Full address

### 2. Dated Events

Events that occur on specific dates or date ranges.

**Required Fields:**
- `slug` - Unique identifier (kebab-case)
- `title` - Event name
- `type: dated`
- `startDate` - Start date (format: "January 9, 2026")
- `endDate` - End date (format: "January 17, 2026")
- `venue` - Location name
- `address` - Full address
- `days` - **CRITICAL**: Array of day objects (even for single-day events)

**Optional Fields:**
- `rosaryTime` - Time rosary starts (e.g., "6:30 pm")
- `parkingInfo` - Parking details

**Day Object Structure:**
Each item in the `days` array must have:
- `dayNumber` - Sequential number (1, 2, 3...)
- `date` - Full formatted date (e.g., "Friday, 9 January 2026")
- `choir` - Choir or music group performing
- `sponsorsPilgrims` - Sponsors and pilgrims list
- `areaCoordinators` - Coordinator names

## Creating a New Event

### Step 1: Add to events-index.yaml

Open `public/events-index.yaml` and add your event entry.

**For Recurring Events:**
```yaml
- slug: your-event-slug
  title: Your Event Title
  type: recurring
  recurrence: Every First Friday of the Month
  time: 7:30 PM
  venue: Venue Name
  address: Full Address Here
```

**For Dated Events:**
```yaml
- slug: your-event-slug
  title: Your Event Title
  type: dated
  startDate: January 9, 2026
  endDate: January 17, 2026
  venue: Venue Name
  address: Full Address Here
  rosaryTime: 6:30 pm  # optional
```

### Step 2: Create Event Markdown File

Create a new file at `public/events/[slug].md` with the same slug used in the index.

**For Recurring Events:**
```markdown
---
title: Your Event Title
type: recurring
recurrence: Every First Friday of the Month
time: 7:30 PM
venue: Venue Name
address: Full Address Here
slug: your-event-slug
---

Additional information about the event in markdown format.
```

**For Dated Events (Multi-Day):**
```markdown
---
title: Your Event Title
type: dated
startDate: January 9, 2026
endDate: January 17, 2026
venue: Venue Name
address: Full Address Here
slug: your-event-slug
rosaryTime: 6:30 pm
days:
  - dayNumber: 1
    date: Friday, 9 January 2026
    choir: Choir Name
    sponsorsPilgrims: List of sponsors and pilgrims
    areaCoordinators: Coordinator names
  - dayNumber: 2
    date: Saturday, 10 January 2026
    choir: Another Choir
    sponsorsPilgrims: List of sponsors and pilgrims
    areaCoordinators: Coordinator names
parkingInfo: Parking details here
---

Additional event description in markdown format.
```

**For Dated Events (Single-Day):**
```markdown
---
title: Your Event Title
type: dated
startDate: January 18, 2026
endDate: January 18, 2026
venue: Venue Name
address: Full Address Here
slug: your-event-slug
days:
  - dayNumber: 1
    date: Saturday, 18 January 2026
    choir: Choir Name
    sponsorsPilgrims: Sponsors and attendees
    areaCoordinators: Coordinator names
parkingInfo: Parking information
---

Additional event details in markdown format.
```

## File Structure

```
public/
├── events-index.yaml              # Event metadata index
└── events/                        # Event detail files
    ├── santo-nino-novena-mass.md
    ├── santo-nino-fiesta-2025.md
    ├── santo-nino-fiesta-2026.md
    └── your-event-slug.md

src/
├── lib/
│   └── events.ts                  # Event processing logic
└── app/
    └── events/
        ├── page.tsx               # Events list page
        ├── EventsPageClient.tsx   # Calendar UI
        └── [slug]/
            └── page.tsx           # Event detail page
```

## Common Pitfalls

### ❌ CRITICAL: Missing `days` Array for Dated Events

**Problem:** Build fails with `TypeError: Cannot read properties of undefined (reading 'map')`

**Cause:** The event detail page (`src/app/events/[slug]/page.tsx:74`) calls `event.days.map()` for all dated events.

**Solution:** Always include a `days` array, even for single-day events.

```yaml
# ✅ CORRECT - Single day event with days array
days:
  - dayNumber: 1
    date: Saturday, 18 January 2026
    choir: Various Choirs
    sponsorsPilgrims: All Attendees
    areaCoordinators: Event Coordinators

# ❌ WRONG - Missing days array (will cause build error)
# No days property defined
```

### Date Format Consistency

**In events-index.yaml:**
- Use format: `January 9, 2026`

**In event markdown frontmatter:**
- `startDate` and `endDate`: `January 9, 2026`
- `date` (in days array): `Friday, 9 January 2026` (includes day of week)

### Slug Consistency

The slug must be identical in:
1. `events-index.yaml` (`slug: santo-nino-fiesta-2026`)
2. Markdown filename (`santo-nino-fiesta-2026.md`)
3. Markdown frontmatter (`slug: santo-nino-fiesta-2026`)

Use kebab-case (lowercase with hyphens).

### YAML Indentation

YAML is whitespace-sensitive. Use **2 spaces** for indentation:

```yaml
days:
  - dayNumber: 1           # 2 spaces
    date: Friday...        # 4 spaces (2 + 2)
    choir: Name            # 4 spaces
```

## Examples

### Example 1: Recurring Monthly Mass

**events-index.yaml:**
```yaml
- slug: monthly-mass
  title: Monthly Santo Nino Mass
  type: recurring
  recurrence: Every First Friday of the Month
  time: 7:30 PM
  venue: St Benedicts Church
  address: 1 Saint Benedicts Street, Eden Terrace, Auckland 1010
```

**events/monthly-mass.md:**
```markdown
---
title: Monthly Santo Nino Mass
type: recurring
recurrence: Every First Friday of the Month
time: 7:30 PM
venue: St Benedicts Church
address: 1 Saint Benedicts Street, Eden Terrace, Auckland 1010
slug: monthly-mass
---

Join us for our monthly Santo Nino devotion mass.
```

### Example 2: Multi-Day Novena

**events-index.yaml:**
```yaml
- slug: santo-nino-fiesta-2026
  title: Santo Nino Fiesta Mass 2026
  type: dated
  startDate: January 9, 2026
  endDate: January 17, 2026
  venue: St. Benedict's Parish of Newton-Auckland
  address: 1 St Benedict's Street, Eden Terrace, Auckland 1010
  rosaryTime: 6:30 pm
```

**events/santo-nino-fiesta-2026.md:**
```markdown
---
title: Santo Nino Fiesta Mass 2026
type: dated
startDate: January 9, 2026
endDate: January 17, 2026
venue: St. Benedict's Parish of Newton-Auckland
address: 1 St Benedict's Street, Eden Terrace, Auckland 1010
rosaryTime: 6:30 pm
slug: santo-nino-fiesta-2026
days:
  - dayNumber: 1
    date: Friday, 9 January 2026
    choir: HUNI (Holy Cross Parish Papatoetoe Filipino Choir)
    sponsorsPilgrims: All devotees of Senor Sto. Niño & Organizers
    areaCoordinators: Piercy and Mercy Gomez
  - dayNumber: 2
    date: Saturday, 10 January 2026
    choir: Voice of God Catholic Charismatic Renewal Family Choir
    sponsorsPilgrims: St John Paul II Catholic Community – Albany
    areaCoordinators: Emerson & Bernadette Nufable
parkingInfo: Free parking available at Wilson's Carpark
---

This is the 9-day novena schedule for Santo Nino Fiesta 2026.
```

### Example 3: Single-Day Festival

**events-index.yaml:**
```yaml
- slug: fiesta-celebration-2026
  title: Santo Nino Fiesta Celebration 2026
  type: dated
  startDate: January 18, 2026
  endDate: January 18, 2026
  venue: Eventfinda Stadium
  address: Silverfield and Argus Place, Wairau Valley, North Shore, Auckland
```

**events/fiesta-celebration-2026.md:**
```markdown
---
title: Santo Nino Fiesta Celebration 2026
type: dated
startDate: January 18, 2026
endDate: January 18, 2026
venue: Eventfinda Stadium
address: Silverfield and Argus Place, Wairau Valley, North Shore, Auckland
slug: fiesta-celebration-2026
days:
  - dayNumber: 1
    date: Saturday, 18 January 2026
    choir: Various Choirs
    sponsorsPilgrims: All Santo Nino Devotees and Supporters
    areaCoordinators: All Organizing Committee Members
parkingInfo: Parking available at Eventfinda Stadium
---

## Schedule

**10:00 AM** - Procession
**11:00 AM** - Mass
**12:30 PM** - Lunch
**1:30 PM** - Program & Activities
**2:00 PM** - Sinulog Competition
```

## TypeScript Types Reference

For reference, here are the TypeScript interfaces used (from `src/lib/events.ts`):

```typescript
interface RecurringEvent {
  slug: string;
  title: string;
  type: 'recurring';
  recurrence: string;
  time: string;
  venue: string;
  address: string;
  contentHtml?: string;
}

interface DatedEvent {
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

interface DatedEventDay {
  dayNumber: number;
  date: string;
  choir: string;
  sponsorsPilgrims: string;
  areaCoordinators: string;
}
```

## Testing Your Event

After creating your event:

1. **Run the build:**
   ```bash
   npm run build
   ```

2. **Check for errors:**
   - Missing `days` array: `TypeError: Cannot read properties of undefined (reading 'map')`
   - YAML syntax errors: Build will fail with parsing errors
   - Missing files: `ENOENT: no such file or directory`

3. **View locally:**
   ```bash
   npm run dev
   ```
   Then visit:
   - Calendar: `http://localhost:3000/events`
   - Event detail: `http://localhost:3000/events/[your-slug]`

## Support

For issues or questions about the events system:
- Check TypeScript interfaces in `src/lib/events.ts`
- Review existing events in `public/events/` for examples
- Ensure YAML syntax is valid (2-space indentation, proper nesting)

---

**Last Updated:** January 2026
**Maintained By:** Santo Nino NZ Development Team
