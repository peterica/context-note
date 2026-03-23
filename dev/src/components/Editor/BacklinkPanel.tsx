'use client';

import { useMemo } from 'react';
import { useStore } from '@/store/useStore';

export default function BacklinkPanel() {
  const { selectedFileId, backlinkIndex, selectFile } = useStore();

  const backlinks = useMemo(() => {
    if (!selectedFileId) return [];
    return backlinkIndex.get(selectedFileId) || [];
  }, [selectedFileId, backlinkIndex]);

  if (backlinks.length === 0) return null;

  return (
    <div className="border-t border-border bg-sidebar-bg px-4 py-2">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
        Backlinks ({backlinks.length})
      </div>
      <div className="flex flex-wrap gap-1">
        {backlinks.map((linkId) => (
          <button
            key={linkId}
            onClick={() => selectFile(linkId)}
            className="px-2 py-0.5 text-xs text-primary hover:text-foreground hover:bg-hover-bg rounded transition-colors truncate max-w-48"
          >
            {linkId}
          </button>
        ))}
      </div>
    </div>
  );
}
