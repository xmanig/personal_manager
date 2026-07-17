import { useState } from 'react';
import { createCalendarEvent } from '../../lib/calendar-api';
import { Button } from '../ui/Button';

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
      ? new Date(initialDate.getTime() - initialDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    initialDate
      ? new Date(initialDate.getTime() + 3600000 - initialDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [isAllDay, setIsAllDay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm dark:bg-black/60">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800 dark:ring-1 dark:ring-gray-700">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Event</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Title <span className="text-red-500">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-900/50"
              placeholder="Event title" autoFocus />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-900/50"
              rows={3} placeholder="Add a description..." />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-900/50"
              placeholder="Add a location" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900" />
            All day event
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Start</label>
              <input type={isAllDay ? 'date' : 'datetime-local'} value={isAllDay ? startTime.split('T')[0] : startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-900/50" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">End</label>
              <input type={isAllDay ? 'date' : 'datetime-local'} value={isAllDay ? endTime.split('T')[0] : endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-900/50" />
            </div>
          </div>
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Event</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
