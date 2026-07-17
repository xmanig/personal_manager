import { useState } from 'react';
import { NotesList } from './pages/NotesList';
import { MarkdownEditor } from './components/MarkdownEditor';
import { Note } from './types';
import './App.css';

function App() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const handleSave = (updatedNote: Note) => {
    setSelectedNote(updatedNote);
  };

  return (
    <div className="flex h-screen">
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

export default App;
