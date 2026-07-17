import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen">
        <nav className="w-48 border-r bg-gray-50 p-4">
          <h1 className="mb-4 text-lg font-semibold">Personal Manager</h1>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="text-blue-600 hover:underline">
                Notes
              </Link>
            </li>
            <li>
              <Link to="/calendar" className="text-blue-600 hover:underline">
                Calendar
              </Link>
            </li>
            <li>
              <Link to="/bills" className="text-blue-600 hover:underline">
                Bills
              </Link>
            </li>
          </ul>
        </nav>

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
