import { useState } from 'react';
import { NotesList } from './pages/NotesList';
import { Note } from './types';
import './App.css';

function App() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  return (
    <div className="h-screen">
      <NotesList
        onSelectNote={setSelectedNote}
        selectedNoteId={selectedNote?.id}
      />
    </div>
  );
}

export default App;
