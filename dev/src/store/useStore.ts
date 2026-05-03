import { create } from 'zustand';
import { FileNode } from '@/types';
import { buildBacklinkIndex } from '@/lib/wikilink';

export type SaveStatus = 'idle' | 'editing' | 'saving' | 'saved' | 'error';

const PROJECT_STORAGE_KEY = 'cn:currentProject';

interface StoreState {
  // Multi-project
  currentProject: string | null;

  tree: FileNode[];
  selectedFileId: string | null;
  expandedFolders: Set<string>;
  editorContent: string;
  loading: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  isDirty: boolean;

  // Search & Command Palette
  recentFiles: string[];
  searchQuery: string;
  commandPaletteOpen: boolean;

  // Project picker
  projectPickerOpen: boolean;

  // Backlinks
  backlinkIndex: Map<string, string[]>;

  // Project lifecycle
  hydrateProject: () => void;
  setCurrentProject: (project: string | null) => void;
  openProjectPicker: () => void;
  closeProjectPicker: () => void;

  fetchTree: () => Promise<void>;
  selectFile: (id: string) => Promise<void>;
  toggleFolder: (id: string) => void;
  updateContent: (content: string) => void;
  saveFile: () => Promise<void>;
  addFile: (parentId: string, name: string) => Promise<void>;
  addFolder: (parentId: string, name: string) => Promise<void>;
  deleteNode: (id: string, type: 'file' | 'folder') => Promise<void>;
  snapshotFile: (fileId: string) => Promise<void>;
  renameNode: (id: string, newName: string, type: 'file' | 'folder') => Promise<void>;
  moveNode: (id: string, newParentId: string, type: 'file' | 'folder') => Promise<void>;

  // Search & Command Palette actions
  setSearchQuery: (query: string) => void;
  toggleCommandPalette: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  // Backlinks
  buildBacklinks: () => Promise<void>;
}

function withProject(url: string, project: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}project=${encodeURIComponent(project)}`;
}

export const useStore = create<StoreState>((set, get) => ({
  currentProject: null,

  tree: [],
  selectedFileId: null,
  expandedFolders: new Set(['']),
  editorContent: '',
  loading: false,
  saveStatus: 'idle',
  lastSavedAt: null,
  isDirty: false,

  // Search & Command Palette
  recentFiles: [],
  searchQuery: '',
  commandPaletteOpen: false,

  // Project picker
  projectPickerOpen: false,

  // Backlinks
  backlinkIndex: new Map(),

  hydrateProject: () => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(PROJECT_STORAGE_KEY);
    if (stored) {
      set({ currentProject: stored });
    } else {
      set({ projectPickerOpen: true });
    }
  },

  setCurrentProject: (project) => {
    if (typeof window !== 'undefined') {
      if (project) window.localStorage.setItem(PROJECT_STORAGE_KEY, project);
      else window.localStorage.removeItem(PROJECT_STORAGE_KEY);
    }
    set({
      currentProject: project,
      tree: [],
      selectedFileId: null,
      editorContent: '',
      isDirty: false,
      saveStatus: 'idle',
      recentFiles: [],
      backlinkIndex: new Map(),
      expandedFolders: new Set(['']),
      projectPickerOpen: false,
    });
  },

  openProjectPicker: () => set({ projectPickerOpen: true }),
  closeProjectPicker: () => set({ projectPickerOpen: false }),

  fetchTree: async () => {
    const project = get().currentProject;
    if (!project) return;
    const res = await fetch(withProject('/api/tree', project));
    if (!res.ok) return;
    const tree: FileNode[] = await res.json();
    set({ tree });
  },

  selectFile: async (id) => {
    const project = get().currentProject;
    if (!project) return;
    set({ loading: true });
    try {
      const res = await fetch(withProject(`/api/file?path=${encodeURIComponent(id)}`, project));
      if (!res.ok) throw new Error('Failed to load file');
      const data = await res.json();
      const recent = [id, ...get().recentFiles.filter((f) => f !== id)].slice(0, 10);
      set({ selectedFileId: id, editorContent: data.content, loading: false, saveStatus: 'idle', isDirty: false, recentFiles: recent });
    } catch {
      set({ loading: false });
    }
  },

  toggleFolder: (id) => {
    const expanded = new Set(get().expandedFolders);
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    set({ expandedFolders: expanded });
  },

  updateContent: (content) => {
    set({ editorContent: content, saveStatus: 'editing', isDirty: true });
  },

  saveFile: async () => {
    const { selectedFileId, editorContent, currentProject } = get();
    if (!selectedFileId || !currentProject) return;
    set({ saveStatus: 'saving' });

    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await fetch('/api/file', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: currentProject, path: selectedFileId, content: editorContent }),
        });
        if (!res.ok) throw new Error(`Save failed: ${res.status}`);
        set({ saveStatus: 'saved', isDirty: false, lastSavedAt: Date.now() });
        return;
      } catch {
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    set({ saveStatus: 'error' });
  },

  addFile: async (parentId, name) => {
    const project = get().currentProject;
    if (!project) return;
    const fileName = name.endsWith('.md') ? name : `${name}.md`;
    const filePath = parentId ? `${parentId}/${fileName}` : fileName;
    const res = await fetch('/api/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, path: filePath }),
    });
    if (res.ok) {
      const expanded = new Set(get().expandedFolders);
      expanded.add(parentId);
      set({ expandedFolders: expanded });
      await get().fetchTree();
    }
  },

  addFolder: async (parentId, name) => {
    const project = get().currentProject;
    if (!project) return;
    const folderPath = parentId ? `${parentId}/${name}` : name;
    const res = await fetch('/api/folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, path: folderPath }),
    });
    if (res.ok) {
      const expanded = new Set(get().expandedFolders);
      expanded.add(parentId);
      set({ expandedFolders: expanded });
      await get().fetchTree();
    }
  },

  deleteNode: async (id, type) => {
    const project = get().currentProject;
    if (!project) return;
    const endpoint = type === 'folder' ? '/api/folder' : '/api/file';
    const res = await fetch(
      withProject(`${endpoint}?path=${encodeURIComponent(id)}`, project),
      { method: 'DELETE' },
    );
    if (res.ok) {
      const { selectedFileId } = get();
      if (selectedFileId === id || (type === 'folder' && selectedFileId?.startsWith(id + '/'))) {
        set({ selectedFileId: null, editorContent: '' });
      }
      await get().fetchTree();
    }
  },

  renameNode: async (id, newName, type) => {
    const project = get().currentProject;
    if (!project) return;
    const dir = id.includes('/') ? id.substring(0, id.lastIndexOf('/')) : '';
    const newPath = dir ? `${dir}/${newName}` : newName;

    if (type === 'file') {
      const finalName = newName.endsWith('.md') ? newName : `${newName}.md`;
      const finalPath = dir ? `${dir}/${finalName}` : finalName;
      const res = await fetch('/api/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, from: id, to: finalPath }),
      });
      if (res.ok) {
        const { selectedFileId } = get();
        if (selectedFileId === id) {
          set({ selectedFileId: finalPath });
        }
        await get().fetchTree();
      }
    } else {
      const res = await fetch('/api/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, from: id, to: newPath }),
      });
      if (res.ok) {
        const { selectedFileId, expandedFolders } = get();
        // 선택된 파일이 이 폴더 안에 있으면 경로 업데이트
        if (selectedFileId?.startsWith(id + '/')) {
          set({ selectedFileId: selectedFileId.replace(id, newPath) });
        }
        // expandedFolders 업데이트
        const expanded = new Set(expandedFolders);
        if (expanded.has(id)) {
          expanded.delete(id);
          expanded.add(newPath);
        }
        set({ expandedFolders: expanded });
        await get().fetchTree();
      }
    }
  },

  moveNode: async (id, newParentId, type) => {
    const project = get().currentProject;
    if (!project) return;
    const name = id.includes('/') ? id.substring(id.lastIndexOf('/') + 1) : id;
    const newPath = newParentId ? `${newParentId}/${name}` : name;

    const res = await fetch('/api/rename', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, from: id, to: newPath }),
    });
    if (res.ok) {
      const { selectedFileId } = get();
      if (type === 'file' && selectedFileId === id) {
        set({ selectedFileId: newPath });
      } else if (type === 'folder' && selectedFileId?.startsWith(id + '/')) {
        set({ selectedFileId: selectedFileId.replace(id, newPath) });
      }
      const expanded = new Set(get().expandedFolders);
      expanded.add(newParentId);
      set({ expandedFolders: expanded });
      await get().fetchTree();
    }
  },

  snapshotFile: async (fileId) => {
    const project = get().currentProject;
    if (!project) return;
    const res = await fetch(withProject(`/api/file?path=${encodeURIComponent(fileId)}`, project));
    if (!res.ok) return;
    const data = await res.json();

    const baseName = fileId.replace(/\.md$/, '');
    const dir = fileId.includes('/') ? fileId.substring(0, fileId.lastIndexOf('/')) : '';

    const siblings = findSiblings(get().tree, fileId);
    const prefix = baseName.split('/').pop() || baseName;
    const existingVersions = siblings
      .filter((s) => s.name.startsWith(prefix + '_v'))
      .map((s) => {
        const match = s.name.match(/_v(\d+)\.md$/);
        return match ? parseInt(match[1], 10) : 0;
      });
    const nextVersion = existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1;

    const snapshotName = `${prefix}_v${nextVersion}.md`;
    const snapshotPath = dir ? `${dir}/${snapshotName}` : snapshotName;

    await fetch('/api/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, path: snapshotPath }),
    });
    await fetch('/api/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, path: snapshotPath, content: data.content }),
    });

    await get().fetchTree();
  },

  // Search & Command Palette actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),

  // Backlinks
  buildBacklinks: async () => {
    const project = get().currentProject;
    if (!project) return;
    const allFiles = flattenTree(get().tree);
    const filesWithContent: { id: string; content: string }[] = [];
    for (const file of allFiles) {
      try {
        const res = await fetch(withProject(`/api/file?path=${encodeURIComponent(file.id)}`, project));
        if (res.ok) {
          const data = await res.json();
          filesWithContent.push({ id: file.id, content: data.content });
        }
      } catch {
        // skip unreadable files
      }
    }
    const index = buildBacklinkIndex(filesWithContent);
    set({ backlinkIndex: index });
  },
}));

// Flatten tree into a list of files for search
export function flattenTree(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  for (const node of nodes) {
    if (node.type === 'file') {
      result.push(node);
    }
    if (node.children) {
      result.push(...flattenTree(node.children));
    }
  }
  return result;
}

function findSiblings(nodes: FileNode[], fileId: string): FileNode[] {
  for (const node of nodes) {
    if (node.children) {
      if (node.children.some((c) => c.id === fileId)) {
        return node.children;
      }
      const found = findSiblings(node.children, fileId);
      if (found.length > 0) return found;
    }
  }
  return [];
}
