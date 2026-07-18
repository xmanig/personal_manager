import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '../../types/calendar';
import { fetchCalendarEvents } from '../../lib/calendar-api';
import { Button } from '../ui/Button';

interface DayViewProps {
  onSelectEvent: (event: CalendarEvent) => void;
  accountId?: string;
  getAccountColor?: (event: CalendarEvent) => string;
}

export function DayView({ onSelectEvent, accountId, getAccountColor }: DayViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);
      const response = await fetchCalendarEvents(startOfDay, endOfDay, accountId);
      setEvents(response.events);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const isTodayView = () => {
    const today = new Date();
    return (
      currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getDate() === today.getDate()
    );
  };

  const navigateDay = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourHeight = 60;

  const getCurrentTimePosition = () => {
    if (!isTodayView()) return null;
    const now = new Date();
    return now.getHours() * hourHeight + (now.getMinutes() / 60) * hourHeight;
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigateDay(-1)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Button>
          <h2 className="min-w-[200px] text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
            {currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigateDay(1)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Button>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
      </div>

      <div className="relative flex flex-1 overflow-auto">
        <div className="sticky left-0 z-10 w-16 shrink-0 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950">
          {hours.map((hour) => (
            <div key={hour} className="border-b border-gray-100 px-2 pt-0 text-[11px] text-gray-400 dark:border-gray-800 dark:text-gray-500" style={{ height: hourHeight }}>
              {hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`}
            </div>
          ))}
        </div>

        <div className="relative flex-1">
          <div className={`min-h-[1440px] ${isTodayView() ? 'bg-primary-50/20 dark:bg-primary-900/10' : ''}`}>
            {hours.map((hour) => (
              <div key={hour} className="border-b border-gray-100 dark:border-gray-800" style={{ height: hourHeight }} />
            ))}

            {currentTimePosition !== null && (
              <div className="pointer-events-none absolute left-0 right-0 z-20" style={{ top: `${currentTimePosition}px` }}>
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow" />
                  <div className="flex-1 border-t-2 border-red-500" />
                </div>
              </div>
            )}

            {events.map((event) => {
              const startTime = new Date(event.startTime);
              const endTime = new Date(event.endTime);
              const startHour = startTime.getHours() + startTime.getMinutes() / 60;
              const endHour = endTime.getHours() + endTime.getMinutes() / 60;
              const duration = endHour - startHour;

              return (
                <div
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  className={`absolute left-1.5 right-1.5 z-10 cursor-pointer overflow-hidden rounded-xl px-3 py-2 text-white shadow-sm transition-all hover:shadow ${
                    getAccountColor ? getAccountColor(event) : 'bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500'
                  }`}
                  style={{ top: `${startHour * hourHeight}px`, height: `${Math.max(duration * hourHeight, 30)}px` }}
                >
                  <div className="truncate font-medium">{event.title}</div>
                  <div className="text-xs text-primary-100 opacity-90">
                    {startTime.toLocaleTimeString('default', { hour: 'numeric', minute: '2-digit' })}
                    {' — '}
                    {endTime.toLocaleTimeString('default', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                  {event.location && duration > 1 && (
                    <div className="mt-0.5 truncate text-xs text-primary-200">{event.location}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-950/60">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-primary-900 dark:border-t-primary-400" />
          </div>
        )}
      </div>
    </div>
  );
}
