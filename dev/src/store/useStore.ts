import { create } from 'zustand';
import { FileNode } from '@/types';

interface StoreState {
  tree: FileNode[];
  selectedFileId: string | null;
  expandedFolders: Set<string>;
  editorContent: string;
  loading: boolean;

  fetchTree: () => Promise<void>;
  selectFile: (id: string) => Promise<void>;
  toggleFolder: (id: string) => void;
  updateContent: (content: string) => void;
  saveFile: () => Promise<void>;
  addFile: (parentId: string, name: string) => Promise<void>;
  addFolder: (parentId: string, name: string) => Promise<void>;
  deleteNode: (id: string, type: 'file' | 'folder') => Promise<void>;
  snapshotFile: (fileId: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  tree: [],
  selectedFileId: null,
  expandedFolders: new Set(['']), // root id = ''
  editorContent: '',
  loading: false,

  fetchTree: async () => {
    const res = await fetch('/api/tree');
    const tree: FileNode[] = await res.json();
    set({ tree });
  },

  selectFile: async (id) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error('Failed to load file');
      const data = await res.json();
      set({ selectedFileId: id, editorContent: data.content, loading: false });
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
    set({ editorContent: content });
  },

  saveFile: async () => {
    const { selectedFileId, editorContent } = get();
    if (!selectedFileId) return;
    await fetch('/api/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: selectedFileId, content: editorContent }),
    });
  },

  addFile: async (parentId, name) => {
    const fileName = name.endsWith('.md') ? name : `${name}.md`;
    const filePath = parentId ? `${parentId}/${fileName}` : fileName;
    const res = await fetch('/api/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath }),
    });
    if (res.ok) {
      const expanded = new Set(get().expandedFolders);
      expanded.add(parentId);
      set({ expandedFolders: expanded });
      await get().fetchTree();
    }
  },

  addFolder: async (parentId, name) => {
    const folderPath = parentId ? `${parentId}/${name}` : name;
    const res = await fetch('/api/folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: folderPath }),
    });
    if (res.ok) {
      const expanded = new Set(get().expandedFolders);
      expanded.add(parentId);
      set({ expandedFolders: expanded });
      await get().fetchTree();
    }
  },

  deleteNode: async (id, type) => {
    const endpoint = type === 'folder' ? '/api/folder' : '/api/file';
    const res = await fetch(`${endpoint}?path=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const { selectedFileId } = get();
      if (selectedFileId === id || (type === 'folder' && selectedFileId?.startsWith(id + '/'))) {
        set({ selectedFileId: null, editorContent: '' });
      }
      await get().fetchTree();
    }
  },

  snapshotFile: async (fileId) => {
    // 현재 파일 내용 읽기
    const res = await fetch(`/api/file?path=${encodeURIComponent(fileId)}`);
    if (!res.ok) return;
    const data = await res.json();

    // 버전 넘버링: design.md → design_v1.md, design_v2.md ...
    const baseName = fileId.replace(/\.md$/, '');
    const dir = fileId.includes('/') ? fileId.substring(0, fileId.lastIndexOf('/')) : '';

    // 트리에서 형제 파일 확인
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

    // 스냅샷 파일 생성 후 내용 덮어쓰기
    await fetch('/api/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: snapshotPath }),
    });
    await fetch('/api/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: snapshotPath, content: data.content }),
    });

    await get().fetchTree();
  },
}));

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
