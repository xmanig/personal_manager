import { CalendarEvent, CalendarResponse } from '../types/calendar';

const API_BASE = 'http://localhost:3001/api';

export async function fetchCalendarEvents(from: Date, to: Date): Promise<CalendarResponse> {
  const response = await fetch(
    `${API_BASE}/calendar/events?from=${from.toISOString()}&to=${to.toISOString()}`,
    { credentials: 'include' }
  );
  if (!response.ok) {
    throw new Error('Failed to fetch calendar events');
  }
  return response.json();
}

export async function createCalendarEvent(data: {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isAllDay?: boolean;
}): Promise<CalendarEvent> {
  const response = await fetch(`${API_BASE}/calendar/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create calendar event');
  }
  return response.json();
}

export async function updateCalendarEvent(
  id: string,
  data: {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
  }
): Promise<CalendarEvent> {
  const response = await fetch(`${API_BASE}/calendar/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update calendar event');
  }
  return response.json();
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/calendar/events/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to delete calendar event');
  }
}
