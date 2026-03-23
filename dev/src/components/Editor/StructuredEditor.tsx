'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import LandingGuide from './LandingGuide';
import StatusBar from './StatusBar';
import EditorToolbar from './EditorToolbar';
import SlashMenu from './SlashMenu';
import MetadataPanel from './MetadataPanel';
import BacklinkPanel from './BacklinkPanel';
import { marked } from 'marked';
import { renderWikiLinks } from '@/lib/wikilink';
import { flattenTree } from '@/store/useStore';

marked.setOptions({ async: false, gfm: true, breaks: false });

type ViewMode = 'raw' | 'preview';
const SAVE_DELAY = 1000;

export default function StructuredEditor() {
  const { selectedFileId, editorContent, loading, isDirty, updateContent, saveFile, selectFile: storeSelectFile, tree } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('raw');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [slashMenu, setSlashMenu] = useState<{ top: number; left: number; filter: string } | null>(null);

  // Focus textarea on file select
  useEffect(() => {
    if (selectedFileId && viewMode === 'raw') {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [selectedFileId, viewMode]);

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveFile();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // beforeunload warning when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { saveFile(); }, SAVE_DELAY);
  }, [saveFile]);

  // Helper: insert text at cursor, replacing selection
  const insertAtCursor = useCallback((before: string, after?: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = editorContent.slice(start, end);
    const insertion = before + selected + (after || '');
    const newContent = editorContent.slice(0, start) + insertion + editorContent.slice(end);
    updateContent(newContent);
    scheduleSave();
    const cursorPos = start + before.length + selected.length;
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = cursorPos;
      ta.focus();
    });
  }, [editorContent, updateContent, scheduleSave]);

  // Helper: wrap current line with prefix
  const wrapLineWithPrefix = useCallback((prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const lineStart = editorContent.lastIndexOf('\n', pos - 1) + 1;
    const newContent = editorContent.slice(0, lineStart) + prefix + editorContent.slice(lineStart);
    updateContent(newContent);
    scheduleSave();
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = pos + prefix.length;
      ta.focus();
    });
  }, [editorContent, updateContent, scheduleSave]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    updateContent(newValue);
    scheduleSave();

    // Slash command detection
    const ta = e.target;
    const pos = ta.selectionStart;
    const textBeforeCursor = newValue.slice(0, pos);
    const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
    const currentLine = textBeforeCursor.slice(lineStart);

    if (currentLine.startsWith('/')) {
      const rect = ta.getBoundingClientRect();
      const lineNumber = newValue.slice(0, pos).split('\n').length;
      const lineHeight = 24;
      setSlashMenu({
        top: rect.top + Math.min(lineNumber * lineHeight, rect.height - 200),
        left: rect.left + 60,
        filter: currentLine.slice(1),
      });
    } else {
      setSlashMenu(null);
    }
  }, [updateContent, scheduleSave]);

  const handleSlashSelect = useCallback((insert: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const textBefore = editorContent.slice(0, pos);
    const lineStart = textBefore.lastIndexOf('\n') + 1;
    const newContent = editorContent.slice(0, lineStart) + insert + editorContent.slice(pos);
    updateContent(newContent);
    scheduleSave();
    setSlashMenu(null);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = lineStart + insert.length;
      ta.focus();
    });
  }, [editorContent, updateContent, scheduleSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Skip if slash menu is handling keys
    if (slashMenu && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) return;

    // Tab
    if (e.key === 'Tab') {
      e.preventDefault();
      insertAtCursor('  ');
      return;
    }

    // Cmd+B → Bold
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      insertAtCursor('**', '**');
      return;
    }

    // Cmd+I → Italic
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      insertAtCursor('_', '_');
      return;
    }

    // Cmd+Shift+H → Heading
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'H') {
      e.preventDefault();
      wrapLineWithPrefix('## ');
      return;
    }

    // Escape closes slash menu
    if (e.key === 'Escape' && slashMenu) {
      setSlashMenu(null);
    }
  }, [slashMenu, insertAtCursor, wrapLineWithPrefix]);

  const existingFileIds = useMemo(() => {
    return new Set(flattenTree(tree).map((f) => f.id));
  }, [tree]);

  const previewHtml = useMemo(() => {
    if (viewMode !== 'preview' || !editorContent) return '';
    const html = marked.parse(editorContent) as string;
    return renderWikiLinks(html, existingFileIds);
  }, [viewMode, editorContent, existingFileIds]);

  // Handle wikilink clicks in preview
  const handlePreviewClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('wikilink')) {
      e.preventDefault();
      const fileId = target.getAttribute('data-wikilink');
      if (fileId) storeSelectFile(fileId);
    }
  }, [storeSelectFile]);

  if (!selectedFileId) {
    return <LandingGuide />;
  }

  // Breadcrumb segments from file path
  const pathSegments = selectedFileId.split('/');
  const fileName = pathSegments.pop() || '';

  return (
    <div className="flex-1 flex flex-col bg-editor-bg overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-sidebar-bg/60">
        <div className="flex items-center gap-1 text-[12px] min-w-0 overflow-hidden">
          {pathSegments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1 shrink-0">
              <span className="text-muted/60">{seg}</span>
              <span className="text-muted/30">/</span>
            </span>
          ))}
          <span className="text-foreground/90 font-medium truncate">{fileName}</span>
          {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 ml-1.5 shrink-0" />}
        </div>
        <div className="flex items-center shrink-0 ml-3 bg-surface rounded-md p-0.5">
          {(['raw', 'preview'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-[11px] font-medium rounded transition-all ${
                viewMode === mode
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {mode === 'raw' ? 'Editor' : 'Preview'}
            </button>
          ))}
        </div>
      </div>

      {/* Metadata panel */}
      <MetadataPanel />

      {/* Toolbar (raw mode only) */}
      {viewMode === 'raw' && (
        <EditorToolbar onInsert={insertAtCursor} onWrapLine={wrapLineWithPrefix} />
      )}

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted">
          <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading…
        </div>
      ) : viewMode === 'raw' ? (
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={editorContent}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="absolute inset-0 w-full h-full px-6 py-5 bg-editor-bg text-foreground/85 text-[13.5px] leading-[1.75] resize-none outline-none"
            style={{ fontFamily: '"SF Mono", "Cascadia Code", "Fira Code", "JetBrains Mono", monospace' }}
            placeholder="Start writing… (type / for commands)"
          />
          {slashMenu && (
            <SlashMenu
              key={slashMenu.filter}
              position={{ top: slashMenu.top, left: slashMenu.left }}
              filter={slashMenu.filter}
              onSelect={handleSlashSelect}
              onClose={() => setSlashMenu(null)}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto" onClick={handlePreviewClick}>
          <div
            className="tiptap max-w-3xl mx-auto"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      )}

      <BacklinkPanel />
      <StatusBar />
    </div>
  );
}
