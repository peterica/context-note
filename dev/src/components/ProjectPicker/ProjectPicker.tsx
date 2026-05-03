'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';

interface FolderNode {
  id: string;
  name: string;
  children: FolderNode[];
}

interface ProjectListResponse {
  root: string;
  children: FolderNode[];
}

export default function ProjectPicker() {
  const projectPickerOpen = useStore((s) => s.projectPickerOpen);
  if (!projectPickerOpen) return null;
  return <PickerInner />;
}

function PickerInner() {
  const currentProject = useStore((s) => s.currentProject);
  const setCurrentProject = useStore((s) => s.setCurrentProject);
  const closeProjectPicker = useStore((s) => s.closeProjectPicker);

  const [data, setData] = useState<ProjectListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/projects')
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: ProjectListResponse) => setData(d))
      .catch((e) => setError(String(e)));
  }, []);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handlePick = useCallback((id: string) => {
    setCurrentProject(id);
  }, [setCurrentProject]);

  const dismissable = currentProject !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      onClick={dismissable ? closeProjectPicker : undefined}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                Select Project
              </div>
              {data?.root && (
                <div className="text-[10px] text-muted mt-0.5 font-mono truncate">
                  {data.root}
                </div>
              )}
            </div>
            {dismissable && (
              <button
                onClick={closeProjectPicker}
                className="text-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <kbd className="text-[9px] border border-border-subtle rounded px-1.5 py-0.5 font-mono">ESC</kbd>
              </button>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto py-2">
          {error && (
            <div className="px-4 py-6 text-sm text-red-400">Failed to load: {error}</div>
          )}
          {!error && !data && (
            <div className="px-4 py-6 text-sm text-muted">Loading…</div>
          )}
          {data && data.children.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted text-center">
              No subdirectories under workspace root.
            </div>
          )}
          {data?.children.map((node) => (
            <FolderRow
              key={node.id}
              node={node}
              depth={0}
              expanded={expanded}
              onToggle={toggle}
              onPick={handlePick}
              currentProject={currentProject}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 py-2 border-t border-border-subtle text-[10px] text-muted">
          <span>Click a folder to use it as the current project.</span>
        </div>
      </div>
    </div>
  );
}

interface FolderRowProps {
  node: FolderNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onPick: (id: string) => void;
  currentProject: string | null;
}

function FolderRow({ node, depth, expanded, onToggle, onPick, currentProject }: FolderRowProps) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const isCurrent = currentProject === node.id;

  return (
    <>
      <div
        className={`flex items-center gap-1 mx-1.5 rounded-md transition-colors ${
          isCurrent ? 'bg-primary/15 text-foreground' : 'text-foreground/70 hover:bg-hover-bg hover:text-foreground'
        }`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <button
          onClick={() => hasChildren && onToggle(node.id)}
          className={`w-4 h-4 flex items-center justify-center shrink-0 ${hasChildren ? 'text-muted hover:text-foreground' : 'text-transparent'}`}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          tabIndex={hasChildren ? 0 : -1}
        >
          {hasChildren && (
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
        <button
          onClick={() => onPick(node.id)}
          className="flex-1 flex items-center gap-2 py-1.5 text-[13px] text-left truncate"
          title={node.id}
        >
          <svg className="w-3.5 h-3.5 shrink-0 text-muted/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <span className="truncate">{node.name}</span>
          {isCurrent && <span className="ml-auto text-[10px] text-primary">current</span>}
        </button>
      </div>
      {isExpanded && hasChildren && node.children.map((child) => (
        <FolderRow
          key={child.id}
          node={child}
          depth={depth + 1}
          expanded={expanded}
          onToggle={onToggle}
          onPick={onPick}
          currentProject={currentProject}
        />
      ))}
    </>
  );
}
