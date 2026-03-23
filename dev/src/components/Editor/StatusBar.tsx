'use client';

import { useMemo } from 'react';
import { useStore, SaveStatus } from '@/store/useStore';

const STATUS_CONFIG: Record<SaveStatus, { icon: string; label: string; className: string }> = {
  idle: { icon: '', label: '', className: 'text-muted' },
  editing: { icon: '●', label: 'Editing', className: 'text-amber-400/80' },
  saving: { icon: '↻', label: 'Saving…', className: 'text-blue-400/80' },
  saved: { icon: '✓', label: 'Saved', className: 'text-emerald-400/80' },
  error: { icon: '✕', label: 'Error', className: 'text-red-400/80' },
};

export default function StatusBar() {
  const { editorContent, saveStatus, lastSavedAt, isDirty, selectedFileId } = useStore();

  const lineCount = useMemo(() => editorContent.split('\n').length, [editorContent]);
  const charCount = useMemo(() => editorContent.length, [editorContent]);
  const config = STATUS_CONFIG[saveStatus];

  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) return null;
    const d = new Date(lastSavedAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [lastSavedAt]);

  if (!selectedFileId) return null;

  return (
    <div className="flex items-center justify-between px-4 py-1.5 border-t border-border-subtle text-[11px] text-muted bg-sidebar-bg/30">
      <div className="flex items-center gap-4">
        <span className="tabular-nums">{lineCount} lines</span>
        <span className="tabular-nums">{charCount} chars</span>
      </div>
      <div className="flex items-center gap-3">
        {lastSavedLabel && saveStatus !== 'saving' && (
          <span className="text-muted/50 tabular-nums">{lastSavedLabel}</span>
        )}
        {isDirty && saveStatus !== 'saving' && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" title="Unsaved changes" />
        )}
        {config.label && (
          <span className={`flex items-center gap-1 ${config.className}`}>
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </span>
        )}
      </div>
    </div>
  );
}
