'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import TreeNode from './TreeNode';
import { FileNode } from '@/types';

const MIN_WIDTH = 220;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 280;

function filterTree(nodes: FileNode[], query: string): FileNode[] {
  if (!query) return nodes;
  const lowerQuery = query.toLowerCase();
  return nodes.reduce<FileNode[]>((acc, node) => {
    if (node.type === 'file') {
      if (node.name.toLowerCase().includes(lowerQuery)) acc.push(node);
    } else {
      const filteredChildren = filterTree(node.children || [], query);
      if (filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
    }
    return acc;
  }, []);
}

export default function FileTree() {
  const { tree, searchQuery, setSearchQuery, openCommandPalette } = useStore();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);

  const filteredTree = useMemo(() => filterTree(tree, searchQuery), [tree, searchQuery]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + e.clientX - startX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width]);

  return (
    <aside
      className="h-screen bg-sidebar-bg border-r border-border flex flex-col shrink-0 relative"
      style={{ width }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
              Explorer
            </span>
          </div>
          <button
            onClick={openCommandPalette}
            className="text-muted hover:text-foreground transition-colors"
            aria-label="Search"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter files…"
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-surface border border-border-subtle rounded-md text-foreground placeholder-muted outline-none focus:border-primary/50 focus:bg-hover-bg transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-1 pb-2">
        {filteredTree.length === 0 && searchQuery ? (
          <div className="px-3 py-8 text-xs text-muted text-center">
            No results for &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          filteredTree.map((node) => (
            <TreeNode key={node.id} node={node} depth={0} />
          ))
        )}
      </div>

      {/* Cmd+K hint */}
      <div className="px-4 py-2 border-t border-border-subtle">
        <button
          onClick={openCommandPalette}
          className="w-full flex items-center justify-between text-[10px] text-muted hover:text-foreground transition-colors"
        >
          <span>Quick Open</span>
          <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-[3px] h-full cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors"
        onMouseDown={handleMouseDown}
      />
    </aside>
  );
}
