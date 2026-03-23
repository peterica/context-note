'use client';

import { useState, useEffect, useCallback } from 'react';

interface SlashMenuProps {
  position: { top: number; left: number };
  onSelect: (text: string) => void;
  onClose: () => void;
  filter: string;
}

const COMMANDS = [
  { id: 'h1', label: 'Heading 1', icon: 'H1', insert: '# ' },
  { id: 'h2', label: 'Heading 2', icon: 'H2', insert: '## ' },
  { id: 'h3', label: 'Heading 3', icon: 'H3', insert: '### ' },
  { id: 'bullet', label: 'Bullet List', icon: '•', insert: '- ' },
  { id: 'numbered', label: 'Numbered List', icon: '1.', insert: '1. ' },
  { id: 'code', label: 'Code Block', icon: '< >', insert: '```\n\n```' },
  { id: 'table', label: 'Table', icon: '⊞', insert: '| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| | | |' },
  { id: 'hr', label: 'Horizontal Rule', icon: '—', insert: '---' },
  { id: 'quote', label: 'Blockquote', icon: '❝', insert: '> ' },
  { id: 'decision', label: 'Decision Section', icon: '⚖', insert: '## Decision\n\n- **결정**: \n- **근거**: \n- **대안**: ' },
];

export default function SlashMenu({ position, onSelect, onClose, filter }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
    cmd.id.includes(filter.toLowerCase())
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[selectedIndex]) onSelect(filtered[selectedIndex].insert);
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filtered, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  if (filtered.length === 0) {
    onClose();
    return null;
  }

  return (
    <div
      className="fixed z-50 w-56 bg-sidebar-bg border border-border rounded-lg shadow-2xl py-1 overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {filtered.map((cmd, index) => (
        <button
          key={cmd.id}
          onClick={() => onSelect(cmd.insert)}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
            index === selectedIndex
              ? 'bg-primary/20 text-foreground'
              : 'text-gray-400 hover:bg-hover-bg hover:text-foreground'
          }`}
        >
          <span className="w-6 text-center text-xs font-mono opacity-60">{cmd.icon}</span>
          <span>{cmd.label}</span>
        </button>
      ))}
    </div>
  );
}
