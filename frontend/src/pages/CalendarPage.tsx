import { useState, useEffect, useCallback } from 'react';
import { MonthView } from '../components/calendar/MonthView';
import { WeekView } from '../components/calendar/WeekView';
import { DayView } from '../components/calendar/DayView';
import { EventForm } from '../components/calendar/EventForm';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
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

  const views: { key: ViewMode; label: string }[] = [
    { key: 'month', label: 'Month' },
    { key: 'week', label: 'Week' },
    { key: 'day', label: 'Day' },
  ];

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Calendar</h1>
          <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-900">
            {views.map((v) => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  viewMode === v.key
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
          {lastSynced && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Synced {lastSynced.toLocaleTimeString()}
            </span>
          )}
          <Button size="sm" variant="secondary" onClick={handleSync} loading={syncing} disabled={!isOnline}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Sync
          </Button>
          <Button size="sm" onClick={() => { setSelectedDate(new Date()); setShowEventForm(true); }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Event
          </Button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden" key={refreshKey}>
        {viewMode === 'month' && (
          <MonthView
            onSelectEvent={setSelectedEvent}
            onSelectDate={(date) => { setSelectedDate(date); setShowEventForm(true); }}
          />
        )}
        {viewMode === 'week' && <WeekView onSelectEvent={setSelectedEvent} />}
        {viewMode === 'day' && <DayView onSelectEvent={setSelectedEvent} />}
      </div>

      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={selectedEvent?.title}>
        {selectedEvent && (
          <div className="space-y-4">
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{new Date(selectedEvent.startTime).toLocaleString()} — {new Date(selectedEvent.endTime).toLocaleString()}</span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.description && (
                <p className="mt-2 text-gray-500 dark:text-gray-400">{selectedEvent.description}</p>
              )}
              {selectedEvent.isAllDay && <Badge variant="primary">All day</Badge>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="danger" size="sm" onClick={handleDeleteEvent}>Delete</Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {showEventForm && (
        <EventForm
          initialDate={selectedDate}
          onClose={() => { setShowEventForm(false); setSelectedDate(undefined); }}
          onEventCreated={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
