import { useState } from 'react';
import { createCalendarEvent } from '../../lib/calendar-api';

interface EventFormProps {
  initialDate?: Date;
  onClose: () => void;
  onEventCreated: () => void;
}

export function EventForm({ initialDate, onClose, onEventCreated }: EventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState(
    initialDate
      ? new Date(initialDate.getTime() - initialDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    initialDate
      ? new Date(initialDate.getTime() + 3600000 - initialDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [isAllDay, setIsAllDay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createCalendarEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        isAllDay,
      });
      onEventCreated();
      onClose();
    } catch (err) {
      setError('Failed to create event');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create Event</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="Event title"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border px-3 py-2"
              rows={3}
              placeholder="Event description"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="Event location"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="allDay" className="text-sm text-gray-700">
              All day event
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start *</label>
              <input
                type={isAllDay ? 'date' : 'datetime-local'}
                value={isAllDay ? startTime.split('T')[0] : startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End *</label>
              <input
                type={isAllDay ? 'date' : 'datetime-local'}
                value={isAllDay ? endTime.split('T')[0] : endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
