import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-2.5">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="flex-1 bg-transparent font-headline-sm text-headline-sm text-on-surface placeholder:text-outline-variant outline-none"
        />
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-outline-variant/50 bg-surface-container">
            <button
              onClick={() => setShowPreview(false)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-lg ${
                !showPreview
                  ? 'bg-surface-container-high text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Write
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-lg ${
                showPreview
                  ? 'bg-surface-container-high text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Preview
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            {saveStatus === 'saving' && (
              <div className="h-2 w-2 animate-pulse rounded-full bg-tertiary" />
            )}
            {saveStatus === 'saved' && (
              <div className="h-2 w-2 rounded-full bg-secondary" />
            )}
            {saveStatus === 'unsaved' && (
              <div className="h-2 w-2 rounded-full bg-outline-variant" />
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

      <div className="flex items-center gap-1 border-b border-outline-variant/20 px-4 py-1.5">
        <ToolbarButton onClick={() => insertMarkdown('**', '**')} title="Bold">
          <span className="material-symbols-outlined text-[18px]">format_bold</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('*', '*')} title="Italic">
          <span className="material-symbols-outlined text-[18px]">format_italic</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('# ', '')} title="Heading">
          <span className="material-symbols-outlined text-[18px]">title</span>
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-outline-variant/50" />
        <ToolbarButton onClick={() => insertMarkdown('[', '](url)')} title="Link">
          <span className="material-symbols-outlined text-[18px]">link</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('`', '`')} title="Code">
          <span className="material-symbols-outlined text-[18px]">code</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('\n```\n', '\n```\n')} title="Code Block">
          <span className="material-symbols-outlined text-[18px]">data_array</span>
        </ToolbarButton>
      </div>

      <div className="flex-1 overflow-hidden">
        {showPreview ? (
          <div className="h-full overflow-y-auto px-6 py-4">
            <div className="markdown max-w-3xl">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing in Markdown..."
            className="h-full w-full resize-none border-none px-6 py-4 font-numeric-data text-sm text-on-surface placeholder:text-outline-variant outline-none bg-surface"
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
      className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
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
