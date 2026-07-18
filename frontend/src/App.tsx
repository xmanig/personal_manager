import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import logo from './assets/logo.png';
import { NotesList } from './pages/NotesList';
import { MarkdownEditor } from './components/MarkdownEditor';
import { CalendarPage } from './pages/CalendarPage';
import { BillsPage } from './pages/BillsPage';
import { Note } from './types';
import { useState, useEffect } from 'react';
import {
  getAuthStatus, startGoogleAuth, disconnectGoogle,
  listAccounts, deleteAccount, setDefaultAccount, updateAccountLabel,
  getAccountStatus, reconnectAccount,
  AuthStatus, GoogleAccount,
} from './lib/auth';

function NotesPage() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const handleSave = (updatedNote: Note) => {
    setSelectedNote(updatedNote);
  };

  return (
    <div className="flex h-full">
      <div className="w-96 shrink-0 border-r border-outline-variant/30">
        <NotesList
          onSelectNote={setSelectedNote}
          selectedNoteId={selectedNote?.id}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        {selectedNote ? (
          <MarkdownEditor note={selectedNote} onSave={handleSave} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined mb-4 text-[48px] text-outline">description</span>
            <p className="text-sm">Select a note to start editing</p>
          </div>
        )}
      </div>
    </div>
  );
}

const navItems = [
  { path: '/', label: 'Notes', icon: 'description' },
  { path: '/calendar', label: 'Calendar', icon: 'calendar_today' },
  { path: '/bills', label: 'Bills', icon: 'receipt_long' },
];

function Sidebar() {
  const location = useLocation();
  const [auth, setAuth] = useState<AuthStatus>({ connected: false });
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [showAccounts, setShowAccounts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [accountStatuses, setAccountStatuses] = useState<Record<string, { needsReconnect: boolean }>>({});

  const refresh = async () => {
    const status = await getAuthStatus();
    setAuth(status);
    if (status.connected) {
      const accs = await listAccounts();
      setAccounts(accs);
      const statuses: Record<string, { needsReconnect: boolean }> = {};
      for (const acc of accs) {
        try {
          const s = await getAccountStatus(acc.id);
          statuses[acc.id] = { needsReconnect: s.needsReconnect };
        } catch {
          statuses[acc.id] = { needsReconnect: true };
        }
      }
      setAccountStatuses(statuses);
    } else {
      setAccounts([]);
      setAccountStatuses({});
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleConnect = () => startGoogleAuth();
  const handleDisconnect = async () => {
    setLoading(true);
    try { await disconnectGoogle(); setAuth({ connected: false }); setAccounts([]); }
    catch { console.error('Failed to disconnect'); }
    finally { setLoading(false); }
  };
  const handleDeleteAccount = async (id: string) => { await deleteAccount(id); refresh(); };
  const handleSetDefault = async (id: string) => { await setDefaultAccount(id); refresh(); };
  const handleSaveLabel = async (id: string) => {
    if (editValue.trim()) { await updateAccountLabel(id, editValue.trim()); }
    setEditingLabel(null); refresh();
  };

  return (
    <nav className="fixed left-0 top-0 h-full w-[280px] bg-surface-container border-r border-outline-variant flex flex-col z-50">
      <div className="p-4">
        <div className="mb-6">
          <img src={logo} alt="Logo" className="w-full h-auto" />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider px-4 mb-2 font-label-md">Main Menu</p>
          {navItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg mx-2 px-4 py-3 transition-all active:scale-95 ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:bg-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {auth.connected && accounts.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowAccounts(!showAccounts)}
              className="flex items-center justify-between w-full px-4 text-[11px] font-bold text-outline uppercase tracking-wider font-label-md"
            >
              <span>Accounts ({accounts.length})</span>
              <span className={`material-symbols-outlined text-[18px] transition-transform ${showAccounts ? 'rotate-90' : ''}`}>chevron_right</span>
            </button>
            {showAccounts && (
              <div className="mt-2 space-y-1">
                {accounts.map((acc) => (
                  <div key={acc.id} className="px-4 py-2 text-xs text-on-surface-variant">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        {editingLabel === acc.id ? (
                          <input
                            type="text" value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveLabel(acc.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel(acc.id)}
                            className="w-full rounded border border-outline-variant bg-surface px-1 py-0.5 text-xs text-on-surface"
                            autoFocus
                          />
                        ) : (
                          <>
                            <div className="flex items-center gap-1">
                              <div className={`h-2 w-2 rounded-full ${accountStatuses[acc.id]?.needsReconnect ? 'bg-tertiary' : 'bg-secondary'}`} />
                              <span className="font-medium text-on-surface truncate">{acc.label || acc.email}</span>
                              {acc.isDefault && (
                                <span className="text-[10px] text-primary font-label-md">Default</span>
                              )}
                            </div>
                            <div className="truncate text-outline">{acc.email}</div>
                          </>
                        )}
                      </div>
                    </div>
                    {editingLabel !== acc.id && (
                      <div className="mt-1 flex gap-2">
                        <button onClick={() => { setEditingLabel(acc.id); setEditValue(acc.label || acc.email); }}
                          className="text-[10px] text-outline hover:text-on-surface">Rename</button>
                        {accountStatuses[acc.id]?.needsReconnect && (
                          <button onClick={() => reconnectAccount(acc.id)}
                            className="text-[10px] font-medium text-tertiary hover:text-tertiary-fixed">Reconnect</button>
                        )}
                        {!acc.isDefault && (
                          <>
                            <button onClick={() => handleSetDefault(acc.id)}
                              className="text-[10px] text-outline hover:text-on-surface">Set Default</button>
                            <button onClick={() => handleDeleteAccount(acc.id)}
                              className="text-[10px] text-error hover:text-on-error-container">Remove</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={() => startGoogleAuth()}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-outline hover:text-on-surface hover:bg-surface-variant rounded-lg mx-2 w-[calc(100%-16px)]">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Add Account
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-outline-variant p-4 space-y-1">
        <div className="px-4 py-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
          {auth.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[24px]">account_circle</span>
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-on-surface truncate text-sm">{auth.email}</p>
                  <p className="text-[11px] text-primary font-label-md">Connected</p>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="w-full py-2 text-[11px] font-bold text-error uppercase tracking-widest font-label-md bg-error-container/10 border border-error-container/20 rounded-lg hover:bg-error-container/20 transition-colors"
              >
                {loading ? 'Disconnecting...' : 'Disconnect All'}
              </button>
            </div>
          ) : (
            <button onClick={handleConnect}
              className="flex w-full items-center gap-3 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
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
      </div>
    </nav>
  );
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex h-screen bg-surface text-on-surface overflow-hidden">
          <Sidebar />
          <main className="flex-1 ml-[280px] h-screen flex flex-col">
            <Routes>
              <Route path="/" element={<NotesPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/bills" element={<BillsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
