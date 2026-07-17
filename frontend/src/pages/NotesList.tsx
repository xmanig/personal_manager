import { useState, useEffect } from 'react';
import { Note, Tag } from '../types';
import { fetchNotes } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

interface NotesListProps {
  onSelectNote: (note: Note) => void;
  selectedNoteId?: string;
}

export function NotesList({ onSelectNote, selectedNoteId }: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const tags: Tag[] = Array.from(
    new Map(
      notes.flatMap((note) => note.tags || []).map((tag) => [tag.id, tag])
    ).values()
  );

  useEffect(() => {
    loadNotes();
  }, [search, selectedTagId]);

  const loadNotes = async () => {
    try {
      const data = await fetchNotes({
        search: search || undefined,
        tagId: selectedTagId || undefined,
      });
      setNotes(data.notes);
    } catch (err) {
      setError('Failed to load notes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Note', content: '' }),
      });
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      onSelectNote(note);
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Notes</h2>
        <Button size="sm" onClick={handleCreateNote}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New
        </Button>
      </div>

      <div className="border-b border-gray-200 px-4 py-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setSelectedTagId(null)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              !selectedTagId
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                selectedTagId === tag.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="m-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {notes.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
            title="No notes yet"
            description="Create your first note to get started"
            action={
              <Button size="sm" onClick={handleCreateNote}>
                Create Note
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`w-full px-4 py-3.5 text-left transition-all hover:bg-gray-50 ${
                  selectedNoteId === note.id ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium text-gray-900">
                      {note.title || 'Untitled'}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {note.content?.slice(0, 120) || 'Empty note'}
                    </p>
                    {note.tags && note.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag.id}>{tag.name}</Badge>
                        ))}
                        {note.tags.length > 3 && (
                          <Badge>+{note.tags.length - 3}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
