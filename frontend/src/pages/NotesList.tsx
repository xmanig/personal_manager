import { useState, useEffect, useCallback } from 'react';
import { Note, Tag } from '../types';
import { fetchNotes } from '../lib/api';

interface NotesListProps {
  onSelectNote: (note: Note) => void;
  selectedNoteId?: string;
}

export function NotesList({ onSelectNote, selectedNoteId }: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [selectedTagId, setSelectedTagId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchNotes({
        search: search || undefined,
        folderId: selectedFolderId,
        tagId: selectedTagId,
      });
      setNotes(response.notes);

      const allTags = new Map<string, Tag>();
      response.notes.forEach((note) =>
        note.tags.forEach((tag) => allTags.set(tag.id, tag))
      );
      setTags(Array.from(allTags.values()));
    } catch (err) {
      setError('Failed to load notes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedFolderId, selectedTagId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return (
    <div className="flex h-full">
      <aside className="w-64 border-r bg-gray-50 p-4">
        <h2 className="mb-4 text-lg font-semibold">Folders</h2>
        <button
          onClick={() => setSelectedFolderId(undefined)}
          className={`mb-2 w-full rounded px-3 py-2 text-left text-sm ${
            !selectedFolderId ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
          }`}
        >
          All Notes
        </button>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTagId(undefined)}
                className={`rounded-full px-3 py-1 text-xs ${
                  !selectedTagId
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTagId(tag.id)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    selectedTagId === tag.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : notes.length === 0 ? (
            <div className="text-center text-gray-500">No notes found</div>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    selectedNoteId === note.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-medium">{note.title}</h3>
                  {note.content && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {note.content.substring(0, 100)}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    {note.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {tag.name}
                      </span>
                    ))}
                    <span className="ml-auto text-xs text-gray-400">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
