import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '../../types/calendar';
import { fetchCalendarEvents } from '../../lib/calendar-api';
import { Button } from '../ui/Button';

interface WeekViewProps {
  onSelectEvent: (event: CalendarEvent) => void;
}

export function WeekView({ onSelectEvent }: WeekViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      const response = await fetchCalendarEvents(startOfWeek, endOfWeek);
      setEvents(response.events);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDate = (date: Date) =>
    events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = getWeekDays();
  const hourHeight = 60;

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigateWeek(-1)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Button>
          <h2 className="min-w-[200px] text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
            {days[0].toLocaleDateString('default', { month: 'short', day: 'numeric' })} —{' '}
            {days[6].toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigateWeek(1)}>
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

        <div className="flex flex-1">
          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="flex-1 border-r border-gray-100 dark:border-gray-800">
              <div className={`sticky top-0 z-10 border-b border-gray-200 bg-white px-2 py-2 text-center text-xs font-medium dark:border-gray-700 dark:bg-gray-950 ${
                isToday(day) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {day.toLocaleDateString('default', { weekday: 'short' })}{' '}
                <span className={isToday(day) ? '' : 'text-gray-700 dark:text-gray-300'}>{day.getDate()}</span>
              </div>
              <div className={`relative min-h-[1440px] ${isToday(day) ? 'bg-primary-50/20 dark:bg-primary-900/10' : ''}`}>
                {hours.map((hour) => (
                  <div key={hour} className="border-b border-gray-100 dark:border-gray-800" style={{ height: hourHeight }} />
                ))}
                {getEventsForDate(day).map((event) => {
                  const startTime = new Date(event.startTime);
                  const endTime = new Date(event.endTime);
                  const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                  const endHour = endTime.getHours() + endTime.getMinutes() / 60;
                  const duration = endHour - startHour;

                  return (
                    <div
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className="absolute left-0.5 right-0.5 z-10 cursor-pointer overflow-hidden rounded-lg bg-primary-500 px-1.5 py-1 text-xs text-white shadow-sm transition-all hover:bg-primary-600 hover:shadow dark:bg-primary-600 dark:hover:bg-primary-500"
                      style={{ top: `${startHour * hourHeight}px`, height: `${Math.max(duration * hourHeight, 20)}px` }}
                    >
                      <div className="truncate font-medium">{event.title}</div>
                      {duration > 0.5 && (
                        <div className="text-[10px] text-primary-100 opacity-90">
                          {startTime.toLocaleTimeString('default', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
