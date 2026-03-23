'use client';

import { useEffect } from 'react';
import FileTree from '@/components/FileTree/FileTree';
import StructuredEditor from '@/components/Editor/StructuredEditor';
import CommandPalette from '@/components/CommandPalette/CommandPalette';
import { useStore } from '@/store/useStore';

export default function Home() {
  const fetchTree = useStore((s) => s.fetchTree);
  const buildBacklinks = useStore((s) => s.buildBacklinks);
  const toggleCommandPalette = useStore((s) => s.toggleCommandPalette);

  useEffect(() => {
    fetchTree().then(() => buildBacklinks());
  }, [fetchTree, buildBacklinks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);

  return (
    <div className="flex h-screen overflow-hidden">
      <FileTree />
      <StructuredEditor />
      <CommandPalette />
    </div>
  );
}
