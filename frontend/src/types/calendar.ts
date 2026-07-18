export interface CalendarEvent {
  id: string;
  googleEventId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
  recurrenceRule: string | null;
  isAllDay: boolean;
  lastLocalEdit: string | null;
  lastGoogleEdit: string | null;
  syncedAt: string;
  googleAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  synced?: number;
}
