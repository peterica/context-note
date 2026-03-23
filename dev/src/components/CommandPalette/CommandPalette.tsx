'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useStore, flattenTree } from '@/store/useStore';

function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < lowerText.length && qi < lowerQuery.length; ti++) {
    if (lowerText[ti] === lowerQuery[qi]) qi++;
  }
  return qi === lowerQuery.length;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let qi = 0;
  let lastIndex = 0;

  for (let ti = 0; ti < lowerText.length && qi < lowerQuery.length; ti++) {
    if (lowerText[ti] === lowerQuery[qi]) {
      if (ti > lastIndex) parts.push(text.slice(lastIndex, ti));
      parts.push(<span key={ti} className="text-primary font-semibold">{text[ti]}</span>);
      lastIndex = ti + 1;
      qi++;
    }
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

// Wrapper: only mounts PaletteInner when open → guarantees fresh state each time
export default function CommandPalette() {
  const commandPaletteOpen = useStore((s) => s.commandPaletteOpen);
  if (!commandPaletteOpen) return null;
  return <PaletteInner />;
}

function PaletteInner() {
  const { tree, recentFiles, closeCommandPalette, selectFile } = useStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allFiles = useMemo(() => flattenTree(tree), [tree]);

  const results = useMemo(() => {
    if (!query) {
      return recentFiles
        .map((id) => allFiles.find((f) => f.id === id))
        .filter(Boolean) as typeof allFiles;
    }
    return allFiles.filter((f) => fuzzyMatch(f.id, query));
  }, [query, allFiles, recentFiles]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[selectedIndex] as HTMLElement;
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = useCallback((fileId: string) => {
    selectFile(fileId);
    closeCommandPalette();
  }, [selectFile, closeCommandPalette]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) handleSelect(results[selectedIndex].id);
        break;
      case 'Escape':
        e.preventDefault();
        closeCommandPalette();
        break;
    }
  }, [results, selectedIndex, handleSelect, closeCommandPalette]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      onClick={closeCommandPalette}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center px-4 border-b border-border-subtle">
          <svg className="w-4 h-4 text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type to search files…"
            className="flex-1 px-3 py-3.5 text-sm bg-transparent text-foreground placeholder-muted outline-none"
          />
          <kbd className="text-[9px] text-muted border border-border-subtle rounded px-1.5 py-0.5 font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1.5">
          {!query && results.length > 0 && (
            <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-muted font-medium">Recent</div>
          )}
          {results.length === 0 ? (
            <div className="px-4 py-10 text-sm text-muted text-center">
              {query ? `No files matching "${query}"` : 'No recent files'}
            </div>
          ) : (
            results.map((file, index) => (
              <button
                key={file.id}
                onClick={() => handleSelect(file.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-[13px] transition-all mx-1.5 rounded-md ${
                  index === selectedIndex
                    ? 'bg-primary/15 text-foreground'
                    : 'text-foreground/60 hover:bg-hover-bg hover:text-foreground'
                }`}
                style={{ width: 'calc(100% - 12px)' }}
              >
                <svg className={`w-3.5 h-3.5 shrink-0 ${index === selectedIndex ? 'text-primary' : 'text-muted/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate">{query ? highlightMatch(file.id, query) : file.id}</span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border-subtle text-[10px] text-muted">
          <span className="flex items-center gap-1"><kbd className="border border-border-subtle rounded px-1 py-0.5 font-mono text-[9px]">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="border border-border-subtle rounded px-1 py-0.5 font-mono text-[9px]">↵</kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="border border-border-subtle rounded px-1 py-0.5 font-mono text-[9px]">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
