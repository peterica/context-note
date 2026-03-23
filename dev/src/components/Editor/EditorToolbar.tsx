'use client';

import Tooltip from '@/components/common/Tooltip';

interface EditorToolbarProps {
  onInsert: (before: string, after?: string) => void;
  onWrapLine: (prefix: string) => void;
}

const TOOL_GROUPS = [
  [
    { label: 'B', tooltip: 'Bold (⌘B)', action: 'wrap' as const, before: '**', after: '**', className: 'font-bold' },
    { label: 'I', tooltip: 'Italic (⌘I)', action: 'wrap' as const, before: '_', after: '_', className: 'italic' },
  ],
  [
    { label: 'H2', tooltip: 'Heading 2 (⌘⇧H)', action: 'line' as const, prefix: '## ' },
    { label: 'H3', tooltip: 'Heading 3', action: 'line' as const, prefix: '### ' },
  ],
  [
    { label: '•', tooltip: 'Bullet List', action: 'line' as const, prefix: '- ' },
    { label: '1.', tooltip: 'Numbered List', action: 'line' as const, prefix: '1. ' },
    { label: '❝', tooltip: 'Blockquote', action: 'line' as const, prefix: '> ' },
  ],
  [
    { label: '⟨⟩', tooltip: 'Code Block', action: 'insert' as const, before: '\n```\n', after: '\n```\n' },
    { label: '—', tooltip: 'Horizontal Rule', action: 'insert' as const, before: '\n---\n' },
  ],
];

export default function EditorToolbar({ onInsert, onWrapLine }: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border-subtle bg-sidebar-bg/50">
      {TOOL_GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <div className="w-px h-4 bg-border-subtle mx-1" />}
          {group.map((tool) => (
            <Tooltip key={tool.label} text={tool.tooltip} position="bottom">
              <button
                onClick={() => {
                  if (tool.action === 'wrap' || tool.action === 'insert') {
                    onInsert(tool.before, 'after' in tool ? tool.after : undefined);
                  } else if (tool.action === 'line') {
                    onWrapLine(tool.prefix);
                  }
                }}
                className={`px-2 py-1 text-xs rounded-md transition-all text-muted hover:text-foreground hover:bg-hover-bg active:scale-95 ${'className' in tool ? tool.className : 'font-mono'}`}
              >
                {tool.label}
              </button>
            </Tooltip>
          ))}
        </div>
      ))}
    </div>
  );
}
