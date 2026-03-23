'use client';

import { useState, useRef } from 'react';
import { FileNode } from '@/types';
import { useStore } from '@/store/useStore';
import ConfirmDialog from '@/components/ConfirmDialog';
import Tooltip from '@/components/common/Tooltip';

interface TreeNodeProps {
  node: FileNode;
  depth: number;
}

export default function TreeNode({ node, depth }: TreeNodeProps) {
  const {
    selectedFileId,
    expandedFolders,
    selectFile,
    toggleFolder,
    addFile,
    addFolder,
    deleteNode,
    snapshotFile,
    renameNode,
    moveNode,
  } = useStore();

  const [showInput, setShowInput] = useState<'file' | 'folder' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: string; message: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isExpanded = expandedFolders.has(node.id);
  const isSelected = selectedFileId === node.id;
  const isFolder = node.type === 'folder';
  const isRoot = depth === 0;

  const handleClick = () => {
    if (isRenaming) return;
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      if (!isRoot) startRename();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        if (isFolder) toggleFolder(node.id);
        else selectFile(node.id);
      }, 250);
    }
  };

  const startRename = () => {
    const displayName = isFolder ? node.name : node.name.replace(/\.md$/, '');
    setRenameValue(displayName);
    setIsRenaming(true);
  };

  const submitRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === node.name || trimmed === node.name.replace(/\.md$/, '')) {
      setIsRenaming(false);
      return;
    }
    setConfirmAction({
      type: 'rename',
      message: `"${node.name}" → "${isFolder ? trimmed : (trimmed.endsWith('.md') ? trimmed : trimmed + '.md')}"\n\nRename?`,
    });
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitRename();
    if (e.key === 'Escape') setIsRenaming(false);
  };

  const handleDelete = () => {
    const itemCount = isFolder ? countChildren(node) : 0;
    const extra = isFolder && itemCount > 0 ? `\n(${itemCount} files inside)` : '';
    setConfirmAction({
      type: 'delete',
      message: `Delete "${node.name}"?${extra}\n\nThis cannot be undone.`,
    });
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isRoot) return;
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: node.id, type: node.type }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isFolder) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!isFolder) return;
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const sourceId: string = data.id;
      const sourceType: 'file' | 'folder' = data.type;
      if (sourceId === node.id || node.id.startsWith(sourceId + '/')) return;
      const sourceParent = sourceId.includes('/') ? sourceId.substring(0, sourceId.lastIndexOf('/')) : '';
      if (sourceParent === node.id) return;
      const sourceName = sourceId.includes('/') ? sourceId.substring(sourceId.lastIndexOf('/') + 1) : sourceId;
      setConfirmAction({
        type: `move:${sourceId}:${sourceType}`,
        message: `Move "${sourceName}" → "${node.name}/"?`,
      });
    } catch { /* ignore */ }
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete') deleteNode(node.id, node.type);
    else if (confirmAction.type === 'rename') { renameNode(node.id, renameValue.trim(), node.type); setIsRenaming(false); }
    else if (confirmAction.type.startsWith('move:')) {
      const parts = confirmAction.type.split(':');
      moveNode(parts[1], node.id, parts[2] as 'file' | 'folder');
    }
    setConfirmAction(null);
  };

  const handleAdd = (type: 'file' | 'folder') => { setShowInput(type); setInputValue(''); };

  const handleSubmit = () => {
    if (!inputValue.trim()) { setShowInput(null); return; }
    if (showInput === 'file') addFile(node.id, inputValue.trim());
    else addFolder(node.id, inputValue.trim());
    setShowInput(null);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') setShowInput(null);
  };

  const displayName = isFolder ? node.name : node.name.replace(/\.md$/, '');

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 mx-1 px-2 py-[5px] cursor-pointer rounded-md text-[13px] group transition-all duration-100 ${
          dragOver
            ? 'bg-primary/15 ring-1 ring-primary/30'
            : isSelected
              ? 'bg-selected-bg text-white'
              : 'hover:bg-hover-bg text-foreground/80 hover:text-foreground'
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={handleClick}
        draggable={!isRoot && !isRenaming}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Icon */}
        <span className="w-4 shrink-0 flex items-center justify-center">
          {isFolder ? (
            <svg className={`w-3 h-3 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''} ${isSelected ? 'text-primary-hover' : 'text-muted'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className={`w-3.5 h-3.5 ${isSelected ? 'text-primary-hover' : 'text-muted/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </span>

        {/* Folder icon (after chevron) */}
        {isFolder && (
          <svg className={`w-3.5 h-3.5 shrink-0 ${isExpanded ? 'text-primary' : 'text-muted/70'}`} fill="currentColor" viewBox="0 0 20 20">
            {isExpanded ? (
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v1H4a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2V8H2V6z" />
            ) : (
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            )}
          </svg>
        )}

        {/* Name */}
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={submitRename}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-surface border border-primary/40 rounded px-1.5 py-0.5 text-[13px] text-foreground outline-none"
          />
        ) : (
          <span className={`truncate flex-1 ${isFolder ? 'font-medium' : ''}`}>
            {displayName}
          </span>
        )}

        {/* Action buttons */}
        {!isRenaming && (
          <span className="hidden group-hover:flex items-center gap-0.5 shrink-0 ml-auto">
            {isFolder && (
              <>
                <Tooltip text="New File">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAdd('file'); }}
                    className="p-0.5 rounded text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label="New file"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip text="New Folder">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAdd('folder'); }}
                    className="p-0.5 rounded text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label="New folder"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </button>
                </Tooltip>
              </>
            )}
            {!isFolder && (
              <Tooltip text="Snapshot">
                <button
                  onClick={(e) => { e.stopPropagation(); snapshotFile(node.id); }}
                  className="p-0.5 rounded text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label="Snapshot"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </button>
              </Tooltip>
            )}
            {!isRoot && (
              <Tooltip text="Delete">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="p-0.5 rounded text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  aria-label="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </Tooltip>
            )}
          </span>
        )}
      </div>

      {/* New file/folder input */}
      {showInput && (
        <div style={{ paddingLeft: `${(depth + 1) * 14 + 28}px` }} className="py-1 pr-2">
          <input
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSubmit}
            placeholder={showInput === 'file' ? 'filename' : 'folder name'}
            className="bg-surface border border-border-subtle rounded-md px-2 py-1 text-[13px] text-foreground outline-none focus:border-primary/50 w-full"
          />
        </div>
      )}

      {/* Children */}
      {isFolder && isExpanded && node.children?.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}

      {/* Confirm dialog */}
      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.message}
          onConfirm={handleConfirm}
          onCancel={() => { setConfirmAction(null); setIsRenaming(false); }}
        />
      )}
    </div>
  );
}

function countChildren(node: FileNode): number {
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => {
    if (child.type === 'file') return sum + 1;
    return sum + countChildren(child);
  }, 0);
}
