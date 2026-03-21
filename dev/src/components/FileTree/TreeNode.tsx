'use client';

import { useState } from 'react';
import { FileNode } from '@/types';
import { useStore } from '@/store/useStore';

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
  } = useStore();

  const [showInput, setShowInput] = useState<'file' | 'folder' | null>(null);
  const [inputValue, setInputValue] = useState('');

  const isExpanded = expandedFolders.has(node.id);
  const isSelected = selectedFileId === node.id;
  const isFolder = node.type === 'folder';

  const handleClick = () => {
    if (isFolder) {
      toggleFolder(node.id);
    } else {
      selectFile(node.id);
    }
  };

  const handleAdd = (type: 'file' | 'folder') => {
    setShowInput(type);
    setInputValue('');
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) {
      setShowInput(null);
      return;
    }
    if (showInput === 'file') {
      addFile(node.id, inputValue.trim());
    } else {
      addFolder(node.id, inputValue.trim());
    }
    setShowInput(null);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') setShowInput(null);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded text-sm group ${
          isSelected
            ? 'bg-selected-bg text-white'
            : 'hover:bg-hover-bg text-foreground'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        <span className="w-4 text-center shrink-0">
          {isFolder ? (isExpanded ? '▾' : '▸') : '📄'}
        </span>
        <span className="truncate flex-1">{node.name}</span>

        {isFolder && (
          <span className="hidden group-hover:flex gap-1 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); handleAdd('file'); }}
              className="text-xs px-1 hover:text-primary"
              title="New file"
            >
              +📄
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleAdd('folder'); }}
              className="text-xs px-1 hover:text-primary"
              title="New folder"
            >
              +📁
            </button>
          </span>
        )}

        {!isFolder && (
          <button
            onClick={(e) => { e.stopPropagation(); snapshotFile(node.id); }}
            className="hidden group-hover:block text-xs px-1 text-gray-400 hover:text-primary shrink-0"
            title="Create snapshot"
          >
            S
          </button>
        )}

        {depth > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); deleteNode(node.id, node.type); }}
            className="hidden group-hover:block text-xs px-1 text-red-400 hover:text-red-300 shrink-0"
            title="Delete"
          >
            ×
          </button>
        )}
      </div>

      {showInput && (
        <div style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }} className="py-1">
          <input
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSubmit}
            placeholder={showInput === 'file' ? 'filename.md' : 'folder name'}
            className="bg-hover-bg border border-border rounded px-2 py-0.5 text-sm text-foreground outline-none focus:border-primary w-full"
          />
        </div>
      )}

      {isFolder && isExpanded && node.children?.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}
