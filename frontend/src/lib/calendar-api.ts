import { CalendarEvent, CalendarResponse } from '../types/calendar';

const API_BASE = 'http://localhost:3001/api';

function buildHeaders(accountId?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accountId) {
    headers['X-Google-Account-Id'] = accountId;
  }
  return headers;
}

export async function fetchCalendarEvents(from: Date, to: Date, accountId?: string): Promise<CalendarResponse> {
  let url = `${API_BASE}/calendar/events?from=${from.toISOString()}&to=${to.toISOString()}`;
  if (accountId) {
    url += `&accountId=${accountId}`;
  }
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Failed to fetch calendar events');
  }
  return response.json();
}

export async function createCalendarEvent(
  data: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    isAllDay?: boolean;
    googleAccountId?: string;
  },
  accountId?: string
): Promise<CalendarEvent> {
  const response = await fetch(`${API_BASE}/calendar/events`, {
    method: 'POST',
    headers: buildHeaders(accountId),
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
  },
  accountId?: string
): Promise<CalendarEvent> {
  const response = await fetch(`${API_BASE}/calendar/events/${id}`, {
    method: 'PUT',
    headers: buildHeaders(accountId),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update calendar event');
  }
  return response.json();
}

export async function deleteCalendarEvent(id: string, accountId?: string): Promise<void> {
  const response = await fetch(`${API_BASE}/calendar/events/${id}`, {
    method: 'DELETE',
    headers: accountId ? { 'X-Google-Account-Id': accountId } : undefined,
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to delete calendar event');
  }
}
