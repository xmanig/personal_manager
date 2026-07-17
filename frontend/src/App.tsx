import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { NotesList } from './pages/NotesList';
import { MarkdownEditor } from './components/MarkdownEditor';
import { CalendarPage } from './pages/CalendarPage';
import { BillsPage } from './pages/BillsPage';
import { Note } from './types';
import { useState } from 'react';
import './App.css';

function NotesPage() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const handleSave = (updatedNote: Note) => {
    setSelectedNote(updatedNote);
  };

  return (
    <div className="flex h-full">
      <div className="w-96 border-r">
        <NotesList
          onSelectNote={setSelectedNote}
          selectedNoteId={selectedNote?.id}
        />
      </div>
      <div className="flex-1">
        {selectedNote ? (
          <MarkdownEditor note={selectedNote} onSave={handleSave} />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Select a note to edit
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Notes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { path: '/calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { path: '/bills', label: 'Bills', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
  ];

  return (
    <nav className="w-48 border-r bg-gray-50 p-4">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <svg className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-lg font-semibold">Personal Manager</span>
        </div>
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
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen">
        <Sidebar />
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
