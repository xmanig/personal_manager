import { useState, useEffect, useCallback } from 'react';
import { MonthView } from '../components/calendar/MonthView';
import { WeekView } from '../components/calendar/WeekView';
import { DayView } from '../components/calendar/DayView';
import { EventForm } from '../components/calendar/EventForm';
import { CalendarEvent } from '../types/calendar';
import { fetchCalendarEvents, deleteCalendarEvent } from '../lib/calendar-api';

type ViewMode = 'month' | 'week' | 'day';

export function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = useCallback(async () => {
    if (!isOnline) return;

    setSyncing(true);
    try {
      const from = new Date();
      from.setMonth(from.getMonth() - 1);
      const to = new Date();
      to.setMonth(to.getMonth() + 1);

      await fetchCalendarEvents(from, to);
      setLastSynced(new Date());
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  }, [isOnline]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      await deleteCalendarEvent(selectedEvent.id);
      setSelectedEvent(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('month')}
            className={`rounded px-3 py-1 ${
              viewMode === 'month' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`rounded px-3 py-1 ${
              viewMode === 'week' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`rounded px-3 py-1 ${
              viewMode === 'day' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
            }`}
          >
            Day
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-gray-600">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {lastSynced && (
            <span className="text-xs text-gray-500">
              Synced {lastSynced.toLocaleTimeString()}
            </span>
          )}

          <button
            onClick={handleSync}
            disabled={syncing || !isOnline}
            className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync'}
          </button>

          <button
            onClick={() => {
              setSelectedDate(new Date());
              setShowEventForm(true);
            }}
            className="rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
          >
            + New Event
          </button>
        </div>
      </div>

      <div className="relative flex-1" key={refreshKey}>
        {viewMode === 'month' && (
          <MonthView onSelectEvent={handleSelectEvent} onSelectDate={handleSelectDate} />
        )}
        {viewMode === 'week' && <WeekView onSelectEvent={handleSelectEvent} />}
        {viewMode === 'day' && <DayView onSelectEvent={handleSelectEvent} />}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Start:</strong>{' '}
                {new Date(selectedEvent.startTime).toLocaleString()}
              </p>
              <p>
                <strong>End:</strong>{' '}
                {new Date(selectedEvent.endTime).toLocaleString()}
              </p>
              {selectedEvent.location && (
                <p>
                  <strong>Location:</strong> {selectedEvent.location}
                </p>
              )}
              {selectedEvent.description && (
                <p>
                  <strong>Description:</strong> {selectedEvent.description}
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handleDeleteEvent}
                className="rounded px-4 py-2 text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showEventForm && (
        <EventForm
          initialDate={selectedDate}
          onClose={() => {
            setShowEventForm(false);
            setSelectedDate(undefined);
          }}
          onEventCreated={() => {
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
