#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Google Calendar API Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read calendar-client.ts <command> [args...]
 *
 * Commands:
 *   list-calendars                              - List all accessible calendars
 *   get-calendar <calendar-id>                  - Get calendar metadata
 *   list-events <calendar-id> [timeMin] [timeMax] - List events in date range
 *   get-event <calendar-id> <event-id>          - Get single event details
 *   create-event <calendar-id> <json>           - Create new event
 *   update-event <calendar-id> <event-id> <json> - Update existing event
 *   delete-event <calendar-id> <event-id>       - Delete event
 *   get-freebusy <json>                         - Query free/busy for calendars
 *   list-colors                                 - Get available calendar colors
 *   quick-add <calendar-id> <text>              - Quick add event from text
 */

import "@std/dotenv/load";
import { getAccessToken as getSharedOAuthToken } from "../../scripts/google.ts";

// Calendar API types
interface Calendar {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
  primary?: boolean;
}

interface CalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  organizer?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  created?: string;
  updated?: string;
  htmlLink?: string;
  colorId?: string;
  recurrence?: string[];
  recurringEventId?: string;
}

interface FreeBusyRequest {
  timeMin: string;
  timeMax: string;
  timeZone?: string;
  items: Array<{ id: string }>;
}

interface FreeBusyResponse {
  kind: string;
  timeMin: string;
  timeMax: string;
  calendars: {
    [calendarId: string]: {
      busy: Array<{ start: string; end: string }>;
      errors?: Array<{ domain: string; reason: string }>;
    };
  };
}

// Calendar API OAuth2 scope
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

/**
 * Get OAuth2 access token (uses shared OAuth library)
 */
async function getAccessToken(): Promise<string> {
  return getSharedOAuthToken(SCOPES);
}

/**
 * Make authenticated request to Calendar API
 */
async function calendarRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3${endpoint}`,
    {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Calendar API error: ${error}`);
  }

  // Handle 204 No Content for delete operations
  if (response.status === 204) {
    return { success: true };
  }

  return response.json();
}

/**
 * List all calendars the user has access to
 */
async function listCalendars(): Promise<Calendar[]> {
  const response = await calendarRequest("/users/me/calendarList");
  return response.items || [];
}

/**
 * Get calendar metadata
 */
async function getCalendar(calendarId: string): Promise<Calendar> {
  return calendarRequest(`/calendars/${encodeURIComponent(calendarId)}`);
}

/**
 * List events in a calendar
 */
async function listEvents(
  calendarId: string,
  timeMin?: string,
  timeMax?: string,
  maxResults: number = 250
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
    singleEvents: "true",
    orderBy: "startTime",
  });

  if (timeMin) params.set("timeMin", timeMin);
  if (timeMax) params.set("timeMax", timeMax);

  const response = await calendarRequest(
    `/calendars/${encodeURIComponent(calendarId)}/events?${params}`
  );
  return response.items || [];
}

/**
 * Get a single event
 */
async function getEvent(
  calendarId: string,
  eventId: string
): Promise<CalendarEvent> {
  return calendarRequest(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
  );
}

/**
 * Create a new event
 */
async function createEvent(
  calendarId: string,
  event: CalendarEvent
): Promise<CalendarEvent> {
  return calendarRequest(
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      body: JSON.stringify(event),
    }
  );
}

/**
 * Update an existing event
 */
async function updateEvent(
  calendarId: string,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  return calendarRequest(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(event),
    }
  );
}

/**
 * Delete an event
 */
async function deleteEvent(
  calendarId: string,
  eventId: string
): Promise<{ success: boolean }> {
  return calendarRequest(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * Query free/busy information
 */
async function getFreeBusy(request: FreeBusyRequest): Promise<FreeBusyResponse> {
  return calendarRequest("/freeBusy", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Get available colors for calendars and events
 */
async function listColors(): Promise<any> {
  return calendarRequest("/colors");
}

/**
 * Quick add an event using natural language
 */
async function quickAddEvent(
  calendarId: string,
  text: string
): Promise<CalendarEvent> {
  const params = new URLSearchParams({ text });
  return calendarRequest(
    `/calendars/${encodeURIComponent(calendarId)}/events/quickAdd?${params}`,
    {
      method: "POST",
    }
  );
}

/**
 * Format event for display
 */
function formatEvent(event: CalendarEvent): object {
  const start = event.start.dateTime || event.start.date;
  const end = event.end.dateTime || event.end.date;

  return {
    id: event.id,
    summary: event.summary || "(No title)",
    start,
    end,
    location: event.location,
    description: event.description,
    status: event.status,
    htmlLink: event.htmlLink,
    attendees: event.attendees?.map(a => ({
      email: a.email,
      name: a.displayName,
      status: a.responseStatus
    })),
  };
}

/**
 * Format calendar for display
 */
function formatCalendar(calendar: Calendar): object {
  return {
    id: calendar.id,
    name: calendar.summary,
    description: calendar.description,
    timeZone: calendar.timeZone,
    accessRole: calendar.accessRole,
    primary: calendar.primary,
    backgroundColor: calendar.backgroundColor,
  };
}

/**
 * Get today's date range in ISO format
 */
function getTodayRange(timeZone: string = "America/Los_Angeles"): { timeMin: string; timeMax: string } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return {
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
  };
}

// Main CLI handler
async function main() {
  const [command, ...args] = Deno.args;

  if (!command) {
    console.log(JSON.stringify({
      error: "No command specified",
      usage: "calendar-client.ts <command> [args...]",
      commands: [
        "list-calendars",
        "get-calendar <calendar-id>",
        "list-events <calendar-id> [timeMin] [timeMax]",
        "get-event <calendar-id> <event-id>",
        "create-event <calendar-id> <json>",
        "update-event <calendar-id> <event-id> <json>",
        "delete-event <calendar-id> <event-id>",
        "get-freebusy <json>",
        "list-colors",
        "quick-add <calendar-id> <text>",
      ],
    }, null, 2));
    return;
  }

  try {
    let result: any;

    switch (command) {
      case "list-calendars": {
        const calendars = await listCalendars();
        result = {
          count: calendars.length,
          calendars: calendars.map(formatCalendar),
        };
        break;
      }

      case "get-calendar": {
        const [calendarId] = args;
        if (!calendarId) {
          throw new Error("Calendar ID required");
        }
        const calendar = await getCalendar(calendarId);
        result = formatCalendar(calendar);
        break;
      }

      case "list-events": {
        const [calendarId, timeMin, timeMax] = args;
        if (!calendarId) {
          throw new Error("Calendar ID required");
        }

        // Default to today if no dates provided
        let effectiveTimeMin = timeMin;
        let effectiveTimeMax = timeMax;

        if (!timeMin && !timeMax) {
          const today = getTodayRange();
          effectiveTimeMin = today.timeMin;
          effectiveTimeMax = today.timeMax;
        }

        const events = await listEvents(calendarId, effectiveTimeMin, effectiveTimeMax);
        result = {
          calendarId,
          timeRange: {
            min: effectiveTimeMin,
            max: effectiveTimeMax,
          },
          count: events.length,
          events: events.map(formatEvent),
        };
        break;
      }

      case "get-event": {
        const [calendarId, eventId] = args;
        if (!calendarId || !eventId) {
          throw new Error("Calendar ID and Event ID required");
        }
        const event = await getEvent(calendarId, eventId);
        result = formatEvent(event);
        break;
      }

      case "create-event": {
        const [calendarId, eventJson] = args;
        if (!calendarId || !eventJson) {
          throw new Error("Calendar ID and event JSON required");
        }
        const eventData = JSON.parse(eventJson);
        const created = await createEvent(calendarId, eventData);
        result = {
          success: true,
          event: formatEvent(created),
        };
        break;
      }

      case "update-event": {
        const [calendarId, eventId, eventJson] = args;
        if (!calendarId || !eventId || !eventJson) {
          throw new Error("Calendar ID, Event ID, and update JSON required");
        }
        const updateData = JSON.parse(eventJson);
        const updated = await updateEvent(calendarId, eventId, updateData);
        result = {
          success: true,
          event: formatEvent(updated),
        };
        break;
      }

      case "delete-event": {
        const [calendarId, eventId] = args;
        if (!calendarId || !eventId) {
          throw new Error("Calendar ID and Event ID required");
        }
        await deleteEvent(calendarId, eventId);
        result = {
          success: true,
          message: `Event ${eventId} deleted from calendar ${calendarId}`,
        };
        break;
      }

      case "get-freebusy": {
        const [requestJson] = args;
        if (!requestJson) {
          throw new Error("FreeBusy request JSON required");
        }
        const freeBusyRequest = JSON.parse(requestJson);
        const freeBusy = await getFreeBusy(freeBusyRequest);
        result = freeBusy;
        break;
      }

      case "list-colors": {
        result = await listColors();
        break;
      }

      case "quick-add": {
        const [calendarId, ...textParts] = args;
        if (!calendarId || textParts.length === 0) {
          throw new Error("Calendar ID and text required");
        }
        const text = textParts.join(" ");
        const created = await quickAddEvent(calendarId, text);
        result = {
          success: true,
          event: formatEvent(created),
        };
        break;
      }

      default:
        throw new Error(`Unknown command: ${command}`);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log(JSON.stringify({
      error: (error as Error).message,
      command,
      args,
    }, null, 2));
    Deno.exit(1);
  }
}

main();
