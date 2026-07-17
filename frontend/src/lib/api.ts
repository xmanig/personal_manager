import { NotesResponse, Note } from '../types';

const API_BASE = 'http://localhost:3001/api';

export async function fetchNotes(params?: {
  page?: number;
  limit?: number;
  search?: string;
  folderId?: string;
  tagId?: string;
}): Promise<NotesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.folderId) searchParams.set('folderId', params.folderId);
  if (params?.tagId) searchParams.set('tagId', params.tagId);

  const response = await fetch(`${API_BASE}/notes?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }
  return response.json();
}

export async function fetchNote(id: string): Promise<Note> {
  const response = await fetch(`${API_BASE}/notes/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch note');
  }
  return response.json();
}

export async function createNote(data: {
  title: string;
  content?: string;
  folderId?: string;
  tagIds?: string[];
}): Promise<Note> {
  const response = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create note');
  }
  return response.json();
}

export async function updateNote(
  id: string,
  data: {
    title?: string;
    content?: string;
    folderId?: string;
    tagIds?: string[];
  }
): Promise<Note> {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update note');
  }
  return response.json();
}

export async function deleteNote(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete note');
  }
}
