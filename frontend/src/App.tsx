import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { NotesList } from './pages/NotesList';
import { MarkdownEditor } from './components/MarkdownEditor';
import { CalendarPage } from './pages/CalendarPage';
import { BillsPage } from './pages/BillsPage';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { Note } from './types';
import { useState, useEffect } from 'react';
import {
  getAuthStatus, startGoogleAuth, disconnectGoogle,
  listAccounts, deleteAccount, setDefaultAccount, updateAccountLabel,
  AuthStatus, GoogleAccount,
} from './lib/auth';

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
  const [auth, setAuth] = useState<AuthStatus>({ connected: false });
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [showAccounts, setShowAccounts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const refresh = async () => {
    const status = await getAuthStatus();
    setAuth(status);
    if (status.connected) {
      const accs = await listAccounts();
      setAccounts(accs);
    } else {
      setAccounts([]);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleConnect = () => {
    startGoogleAuth();
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await disconnectGoogle();
      setAuth({ connected: false });
      setAccounts([]);
    } catch {
      console.error('Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    await deleteAccount(id);
    refresh();
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultAccount(id);
    refresh();
  };

  const handleSaveLabel = async (id: string) => {
    if (editValue.trim()) {
      await updateAccountLabel(id, editValue.trim());
    }
    setEditingLabel(null);
    refresh();
  };

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

      <div className="flex-1 overflow-y-auto px-3 py-4">
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

        {/* Accounts Section */}
        {auth.connected && accounts.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowAccounts(!showAccounts)}
              className="mb-2 flex w-full items-center justify-between px-3 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500"
            >
              <span>Accounts ({accounts.length})</span>
              <svg
                className={`h-3 w-3 transition-transform ${showAccounts ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {showAccounts && (
              <ul className="space-y-1">
                {accounts.map((acc) => (
                  <li key={acc.id} className="rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        {editingLabel === acc.id ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveLabel(acc.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel(acc.id)}
                            className="w-full rounded border border-gray-300 bg-white px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            autoFocus
                          />
                        ) : (
                          <>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-900 dark:text-gray-200">
                                {acc.label || acc.email}
                              </span>
                              {acc.isDefault && (
                                <span className="rounded bg-primary-100 px-1 py-0.5 text-[10px] text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="truncate text-gray-400 dark:text-gray-500">{acc.email}</div>
                          </>
                        )}
                      </div>
                    </div>
                    {editingLabel !== acc.id && (
                      <div className="mt-1 flex gap-2">
                        <button
                          onClick={() => { setEditingLabel(acc.id); setEditValue(acc.label || acc.email); }}
                          className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          Rename
                        </button>
                        {!acc.isDefault && (
                          <>
                            <button
                              onClick={() => handleSetDefault(acc.id)}
                              className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              Set Default
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(acc.id)}
                              className="text-[10px] text-red-400 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => startGoogleAuth()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Add Account
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 px-3 py-3 dark:border-gray-700">
        <ThemeToggle isDark={isDark} onToggle={onToggleDark} />
      </div>

      <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-700">
        {auth.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                </svg>
              </div>
              <div className="flex-1 truncate">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Google</div>
                <div className="truncate text-xs text-gray-500 dark:text-gray-400">{auth.email}</div>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="w-full rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {loading ? 'Disconnecting...' : 'Disconnect All'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Connect Google
          </button>
        )}
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
