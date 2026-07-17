import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '../../types/calendar';
import { fetchCalendarEvents } from '../../lib/calendar-api';

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

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <button
          onClick={() => navigateWeek(-1)}
          className="rounded px-3 py-1 hover:bg-gray-200"
        >
          &larr; Prev
        </button>
        <h2 className="text-lg font-semibold">
          {days[0].toLocaleDateString('default', { month: 'short', day: 'numeric' })} -{' '}
          {days[6].toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
          >
            Today
          </button>
          <button
            onClick={() => navigateWeek(1)}
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

        <div className="flex flex-1">
          {days.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={`flex-1 border-r ${isToday(day) ? 'bg-blue-50' : ''}`}
            >
              <div
                className={`border-b p-2 text-center text-sm ${
                  isToday(day) ? 'font-bold text-blue-600' : 'text-gray-700'
                }`}
              >
                {day.toLocaleDateString('default', { weekday: 'short', day: 'numeric' })}
              </div>
              <div className="relative">
                {hours.map((hour) => (
                  <div key={hour} className="h-[60px] border-b" />
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
                      className="absolute left-0.5 right-0.5 cursor-pointer overflow-hidden rounded bg-blue-500 px-1 py-0.5 text-xs text-white hover:bg-blue-600"
                      style={{
                        top: `${startHour * 60}px`,
                        height: `${Math.max(duration * 60, 20)}px`,
                      }}
                    >
                      <div className="font-medium">{event.title}</div>
                      {duration > 0.5 && (
                        <div className="text-blue-100">
                          {startTime.toLocaleTimeString('default', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
