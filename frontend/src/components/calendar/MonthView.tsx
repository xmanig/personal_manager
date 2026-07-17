import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '../../types/calendar';
import { fetchCalendarEvents } from '../../lib/calendar-api';

interface MonthViewProps {
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectDate: (date: Date) => void;
}

export function MonthView({ onSelectEvent, onSelectDate }: MonthViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      const response = await fetchCalendarEvents(from, to);
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

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
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

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="rounded px-3 py-1 hover:bg-gray-200"
        >
          &larr; Prev
        </button>
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="rounded px-3 py-1 hover:bg-gray-200"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-7">
        {weekDays.map((day) => (
          <div key={day} className="border-b border-r p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}

        {days.map((date, index) => (
          <div
            key={index}
            className={`min-h-[100px] border-b border-r p-1 ${
              date ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-50'
            } ${date && isToday(date) ? 'bg-blue-50' : ''}`}
            onClick={() => date && onSelectDate(date)}
          >
            {date && (
              <>
                <div
                  className={`mb-1 text-sm ${
                    isToday(date) ? 'font-bold text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {getEventsForDate(date)
                    .slice(0, 3)
                    .map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(event);
                        }}
                        className="cursor-pointer truncate rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-800 hover:bg-blue-200"
                      >
                        {event.title}
                      </div>
                    ))}
                  {getEventsForDate(date).length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{getEventsForDate(date).length - 3} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="text-gray-500">Loading...</div>
        </div>
      )}
    </div>
  );
}
