import { useState, useEffect, useCallback, useRef } from 'react';
import Markdown from 'react-markdown';
import { Note } from '../types';
import { updateNote } from '../lib/api';

interface MarkdownEditorProps {
  note: Note;
  onSave: (note: Note) => void;
}

export function MarkdownEditor({ note, onSave }: MarkdownEditorProps) {
  const [content, setContent] = useState(note.content || '');
  const [title, setTitle] = useState(note.title);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await updateNote(note.id, { title, content });
      setLastSaved(new Date());
      onSave(updated);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }, [note.id, title, content, saving, onSave]);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, 1000);
  }, [save]);

  useEffect(() => {
    setContent(note.content || '');
    setTitle(note.title);
  }, [note.id, note.content, note.title]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (content !== (note.content || '') || title !== note.title) {
      debouncedSave();
    }
  }, [content, title, debouncedSave, note.content, note.title]);

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertMarkdown('**', '**');
          break;
        case 'i':
          e.preventDefault();
          insertMarkdown('*', '*');
          break;
        case 'k':
          e.preventDefault();
          insertMarkdown('[', '](url)');
          break;
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-2">
        <div className="flex gap-1">
          <button
            onClick={() => insertMarkdown('**', '**')}
            className="rounded px-2 py-1 text-sm font-bold hover:bg-gray-200"
            title="Bold (Ctrl+B)"
          >
            B
          </button>
          <button
            onClick={() => insertMarkdown('*', '*')}
            className="rounded px-2 py-1 text-sm italic hover:bg-gray-200"
            title="Italic (Ctrl+I)"
          >
            I
          </button>
          <button
            onClick={() => insertMarkdown('## ')}
            className="rounded px-2 py-1 text-sm font-semibold hover:bg-gray-200"
            title="Heading"
          >
            H
          </button>
          <button
            onClick={() => insertMarkdown('[', '](url)')}
            className="rounded px-2 py-1 text-sm hover:bg-gray-200"
            title="Link (Ctrl+K)"
          >
            Link
          </button>
          <button
            onClick={() => insertMarkdown('`', '`')}
            className="rounded px-2 py-1 text-sm font-mono hover:bg-gray-200"
            title="Code"
          >
            Code
          </button>
          <button
            onClick={() => insertMarkdown('```\n', '\n```')}
            className="rounded px-2 py-1 text-sm hover:bg-gray-200"
            title="Code Block"
          >
            Block
          </button>
        </div>
        <div className="text-xs text-gray-500">
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ''}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-full w-full resize-none p-4 font-mono text-sm focus:outline-none"
            placeholder="Write your note in Markdown..."
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="prose max-w-none">
            <Markdown>{content}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
}
