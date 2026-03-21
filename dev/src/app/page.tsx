'use client';

import { useEffect } from 'react';
import FileTree from '@/components/FileTree/FileTree';
import StructuredEditor from '@/components/Editor/StructuredEditor';
import { useStore } from '@/store/useStore';

export default function Home() {
  const fetchTree = useStore((s) => s.fetchTree);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return (
    <div className="flex h-screen overflow-hidden">
      <FileTree />
      <StructuredEditor />
    </div>
  );
}
