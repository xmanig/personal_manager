import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Note } from '../types';
import { updateNote } from '../lib/api';

interface MarkdownEditorProps {
  note: Note;
  onSave: (note: Note) => void;
}

export function MarkdownEditor({ note, onSave }: MarkdownEditorProps) {
  const [content, setContent] = useState(note.content || '');
  const [title, setTitle] = useState(note.title || '');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setContent(note.content || '');
    setTitle(note.title || '');
    setSaveStatus('saved');
  }, [note.id]);

  const debouncedSave = useCallback(
    debounce(async (newContent: string, newTitle: string) => {
      setSaveStatus('saving');
      try {
        const updated = await updateNote(note.id, {
          content: newContent,
          title: newTitle,
        });
        onSave(updated);
        setSaveStatus('saved');
        setLastSaved(new Date());
      } catch {
        setSaveStatus('unsaved');
      }
    }, 1000),
    [note.id, onSave]
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setSaveStatus('unsaved');
    debouncedSave(newContent, title);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSaveStatus('unsaved');
    debouncedSave(content, newTitle);
  };

  const insertMarkdown = (before: string, after: string) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newContent =
      content.substring(0, start) + before + selected + after + content.substring(end);

    setContent(newContent);
    debouncedSave(newContent, title);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selected.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="flex-1 bg-transparent text-lg font-semibold text-gray-900 placeholder-gray-300 outline-none"
        />
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200">
            <button
              onClick={() => setShowPreview(false)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                !showPreview ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Write
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                showPreview ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Preview
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {saveStatus === 'saving' && (
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            )}
            {saveStatus === 'saved' && (
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
            )}
            {saveStatus === 'unsaved' && (
              <div className="h-2 w-2 rounded-full bg-gray-300" />
            )}
            <span>
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                ? lastSaved
                  ? `Saved ${lastSaved.toLocaleTimeString()}`
                  : 'Saved'
                : 'Unsaved'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-100 px-4 py-1.5">
        <ToolbarButton onClick={() => insertMarkdown('**', '**')} title="Bold">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('*', '*')} title="Italic">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 16.5m0-16.5l-7.5 16.5m0-16.5h7.5m-15 0h3m3.75-4.5h3" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('# ', '')} title="Heading">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.5l10.5-5.25L23 7.5m-20.25 0v9m20.25-9l-10.5 5.25M2.25 7.5l10.5 5.25" />
          </svg>
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-gray-200" />
        <ToolbarButton onClick={() => insertMarkdown('[', '](url)')} title="Link">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.318a4.5 4.5 0 00-6.364-6.364L4.757 8.25a4.5 4.5 0 006.364 6.364l4.5-4.5z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('`', '`')} title="Code">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('\n```\n', '\n```\n')} title="Code Block">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
          </svg>
        </ToolbarButton>
      </div>

      <div className="flex-1 overflow-hidden">
        {showPreview ? (
          <div className="h-full overflow-y-auto px-6 py-4">
            <div className="prose max-w-3xl">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing in Markdown..."
            className="h-full w-full resize-none border-none bg-white px-6 py-4 font-mono text-sm text-gray-700 placeholder-gray-300 outline-none"
          />
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
    >
      {children}
    </button>
  );
}

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
