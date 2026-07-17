import { useState } from 'react';
import { MonthView } from '../components/calendar/MonthView';
import { WeekView } from '../components/calendar/WeekView';
import { DayView } from '../components/calendar/DayView';
import { CalendarEvent } from '../types/calendar';

type ViewMode = 'month' | 'week' | 'day';

export function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleSelectDate = (date: Date) => {
    console.log('Selected date:', date);
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
      </div>

      <div className="relative flex-1">
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
                onClick={() => setSelectedEvent(null)}
                className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
