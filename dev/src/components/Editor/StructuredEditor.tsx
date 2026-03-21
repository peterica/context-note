'use client';

import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useStore } from '@/store/useStore';
import Toolbar from './Toolbar';
import StructureValidator from './StructureValidator';
import LandingGuide from './LandingGuide';
import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
});

const SAVE_DELAY = 1000; // 1초 debounce

export default function StructuredEditor() {
  const { selectedFileId, editorContent, loading, updateContent, saveFile } = useStore();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = turndown.turndown(html);
      updateContent(markdown);

      // debounced auto-save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveFile();
      }, SAVE_DELAY);
    },
  });

  // 파일 선택 시 내용 로드
  useEffect(() => {
    if (!editor || !selectedFileId) return;

    if (!editorContent) {
      editor.commands.setContent('');
      return;
    }

    const html = markdownToHtml(editorContent);
    editor.commands.setContent(html);
    setTimeout(() => editor.commands.focus('end'), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reload when file selection changes
  }, [editor, selectedFileId]);

  // 언마운트 시 pending save 실행
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveFile();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!selectedFileId) {
    return <LandingGuide />;
  }

  return (
    <div className="flex-1 flex flex-col bg-editor-bg overflow-hidden">
      <Toolbar editor={editor} />
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <EditorContent editor={editor} className="h-full" />
        </div>
      )}
      <StructureValidator editor={editor} />
    </div>
  );
}

function markdownToHtml(md: string): string {
  return md
    .split('\n')
    .map((line) => {
      if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith('- ')) return `<li>${line.slice(2)}</li>`;
      if (line.trim() === '') return '';
      return `<p>${line}</p>`;
    })
    .join('')
    .replace(/(<li>.*?<\/li>)+/g, (match) => `<ul>${match}</ul>`);
}
