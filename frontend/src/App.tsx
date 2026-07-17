import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { NotesList } from './pages/NotesList';
import { MarkdownEditor } from './components/MarkdownEditor';
import { CalendarPage } from './pages/CalendarPage';
import { BillsPage } from './pages/BillsPage';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { Note } from './types';
import { useState, useEffect } from 'react';

function NotesPage() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const handleSave = (updatedNote: Note) => {
    setSelectedNote(updatedNote);
  };

  return (
    <div className="flex h-full">
      <div className="w-96 shrink-0 border-r border-gray-200 dark:border-gray-700">
        <NotesList
          onSelectNote={setSelectedNote}
          selectedNoteId={selectedNote?.id}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        {selectedNote ? (
          <MarkdownEditor note={selectedNote} onSave={handleSave} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <svg className="mb-4 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Select a note to start editing</p>
          </div>
        )}
      </div>
    </div>
  );
}

const navItems = [
  {
    path: '/',
    label: 'Notes',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    path: '/calendar',
    label: 'Calendar',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    path: '/bills',
    label: 'Bills',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
];

function Sidebar({ isDark, onToggleDark }: { isDark: boolean; onToggleDark: () => void }) {
  const location = useLocation();

  return (
    <nav className="flex h-full w-60 flex-col border-r border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-900/50">
      <div className="flex h-14 items-center gap-2.5 border-b border-gray-200 px-5 dark:border-gray-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
          <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">Personal Manager</span>
      </div>

      <div className="flex-1 px-3 py-4">
        <div className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Menu
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm dark:bg-primary-900/30 dark:text-primary-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <span className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-gray-200 px-3 py-3 dark:border-gray-700">
        <ThemeToggle isDark={isDark} onToggle={onToggleDark} />
      </div>

      <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
            U
          </div>
          <div className="flex-1 truncate">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">User</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Local account</div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <Sidebar isDark={isDark} onToggleDark={() => setIsDark((d) => !d)} />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<NotesPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/bills" element={<BillsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
