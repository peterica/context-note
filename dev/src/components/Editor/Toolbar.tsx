'use client';

import { Editor } from '@tiptap/react';

interface ToolbarProps {
  editor: Editor | null;
}

const TEMPLATE_SECTIONS = ['Problem', 'Design', 'Dev', 'Test', 'Decision', 'Next'];

export default function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  const insertTemplate = () => {
    let html = '';
    for (const section of TEMPLATE_SECTIONS) {
      html += `<h2>${section}</h2><p></p>`;
    }
    editor.chain().focus().setContent(html).run();
  };

  const addSection = () => {
    editor.chain().focus().insertContent('<h2>New Section</h2><p></p>').run();
  };

  const toggleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
  };

  return (
    <div className="flex gap-2 px-4 py-2 border-b border-border bg-sidebar-bg">
      <button
        onClick={insertTemplate}
        className="px-3 py-1 text-sm rounded bg-primary text-white hover:bg-blue-700 transition-colors"
      >
        Init Template
      </button>
      <button
        onClick={addSection}
        className="px-3 py-1 text-sm rounded border border-border text-foreground hover:bg-hover-bg transition-colors"
      >
        + Section (H2)
      </button>
      <button
        onClick={toggleBulletList}
        className={`px-3 py-1 text-sm rounded border border-border transition-colors ${
          editor.isActive('bulletList')
            ? 'bg-primary text-white border-primary'
            : 'text-foreground hover:bg-hover-bg'
        }`}
      >
        List
      </button>
    </div>
  );
}
