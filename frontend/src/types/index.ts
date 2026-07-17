export interface Note {
  id: string;
  title: string;
  content: string | null;
  folderId: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  folder: Folder | null;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  children?: Folder[];
  notes?: Note[];
}

export interface NotesResponse {
  notes: Note[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
