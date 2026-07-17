import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '../../types/calendar';
import { fetchCalendarEvents } from '../../lib/calendar-api';

interface DayViewProps {
  onSelectEvent: (event: CalendarEvent) => void;
}

export function DayView({ onSelectEvent }: DayViewProps) {
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

      const response = await fetchCalendarEvents(startOfDay, endOfDay);
      setEvents(response.events);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const isToday = () => {
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

  const getCurrentTimePosition = () => {
    if (!isToday()) return null;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <button
          onClick={() => navigateDay(-1)}
          className="rounded px-3 py-1 hover:bg-gray-200"
        >
          &larr; Prev
        </button>
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('default', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
          >
            Today
          </button>
          <button
            onClick={() => navigateDay(1)}
            className="rounded px-3 py-1 hover:bg-gray-200"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-16 border-r bg-gray-50">
          {hours.map((hour) => (
            <div key={hour} className="h-[60px] border-b px-2 py-1 text-xs text-gray-500">
              {hour === 0 ? '12 AM' : hour <= 12 ? `${hour} AM` : `${hour - 12} PM`}
            </div>
          ))}
        </div>

        <div className="relative flex-1">
          {hours.map((hour) => (
            <div key={hour} className="h-[60px] border-b" />
          ))}

          {currentTimePosition !== null && (
            <div
              className="absolute left-0 right-0 border-t-2 border-red-500"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500" />
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
                className="absolute left-16 right-4 cursor-pointer overflow-hidden rounded bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
                style={{
                  top: `${startHour * 60}px`,
                  height: `${Math.max(duration * 60, 30)}px`,
                }}
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-sm text-blue-100">
                  {startTime.toLocaleTimeString('default', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {endTime.toLocaleTimeString('default', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
                {event.location && duration > 1 && (
                  <div className="mt-1 text-sm text-blue-200">{event.location}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="text-gray-500">Loading...</div>
        </div>
      )}
    </div>
  );
}
