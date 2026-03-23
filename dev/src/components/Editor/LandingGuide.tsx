'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';

export default function LandingGuide() {
  const selectFile = useStore((s) => s.selectFile);
  const openCommandPalette = useStore((s) => s.openCommandPalette);
  const addFile = useStore((s) => s.addFile);
  const [guide, setGuide] = useState<{ sections: Section[] } | null>(null);

  useEffect(() => {
    fetch('/api/file?path=_atlas-guide.md')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.content) {
          setGuide({ sections: parseGuide(data.content) });
        }
      });
  }, []);

  const handleNewFile = () => {
    addFile('', 'untitled');
  };

  return (
    <div className="flex-1 bg-editor-bg overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Context Note Wiki
          </h1>
          <p className="text-gray-400">
            구조화된 컨텍스트를 관리하는 위키 시스템입니다.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            파일 트리에서 문서를 선택하거나, 아래 버튼으로 시작하세요.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <button
            onClick={handleNewFile}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-hover-bg hover:border-primary hover:bg-primary/10 transition-colors group"
          >
            <span className="text-2xl">📄</span>
            <span className="text-sm font-medium text-foreground group-hover:text-primary">New File</span>
            <span className="text-xs text-gray-500">문서 생성하기</span>
          </button>
          <button
            onClick={openCommandPalette}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-hover-bg hover:border-primary hover:bg-primary/10 transition-colors group"
          >
            <span className="text-2xl">🔍</span>
            <span className="text-sm font-medium text-foreground group-hover:text-primary">Search</span>
            <span className="text-xs text-gray-500">파일 검색하기</span>
          </button>
          <button
            onClick={() => selectFile('_atlas-guide.md')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-hover-bg hover:border-primary hover:bg-primary/10 transition-colors group"
          >
            <span className="text-2xl">📖</span>
            <span className="text-sm font-medium text-foreground group-hover:text-primary">Guide</span>
            <span className="text-xs text-gray-500">가이드 보기</span>
          </button>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mb-8 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <h2 className="text-sm font-semibold text-primary mb-3">Keyboard Shortcuts</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 text-[10px] rounded border border-border bg-hover-bg text-gray-400">⌘K</kbd>
              <span className="text-gray-400">Command Palette</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 text-[10px] rounded border border-border bg-hover-bg text-gray-400">Tab</kbd>
              <span className="text-gray-400">Indent</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 text-[10px] rounded border border-border bg-hover-bg text-gray-400">Double Click</kbd>
              <span className="text-gray-400">Rename</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 text-[10px] rounded border border-border bg-hover-bg text-gray-400">Drag</kbd>
              <span className="text-gray-400">Move file</span>
            </div>
          </div>
        </div>

        {/* Atlas Prompts (if guide loaded) */}
        {guide && guide.sections.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
              Atlas Prompts
            </h2>
            {guide.sections.map((section, i) => (
              <div key={i} className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-2">{section.title}</h3>
                {section.description && (
                  <p className="text-sm text-gray-400 mb-2">{section.description}</p>
                )}
                {section.codeBlock && (
                  <div className="relative group">
                    <pre className="bg-[#0a0f1a] border border-border rounded-lg p-4 text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {section.codeBlock}
                    </pre>
                    <button
                      onClick={() => navigator.clipboard.writeText(section.codeBlock!)}
                      className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-border text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-white"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

interface Section {
  title: string;
  description: string;
  codeBlock: string | null;
}

function parseGuide(md: string): Section[] {
  const sections: Section[] = [];
  const lines = md.split('\n');

  let current: Section | null = null;
  let inCode = false;
  let codeLines: string[] = [];
  let descLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('```') && inCode) {
      inCode = false;
      if (current) current.codeBlock = codeLines.join('\n').trim();
      codeLines = [];
      continue;
    }
    if (line.startsWith('```')) {
      inCode = true;
      if (current) current.description = descLines.join('\n').trim();
      descLines = [];
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith('### ')) {
      if (current) sections.push(current);
      current = { title: line.slice(4), description: '', codeBlock: null };
      descLines = [];
      continue;
    }

    if (current && !line.startsWith('## ')) {
      descLines.push(line);
    }

    if (line.startsWith('## ') && !line.startsWith('### ')) {
      if (current) {
        current.description = descLines.join('\n').trim();
        sections.push(current);
        current = null;
        descLines = [];
      }
    }
  }

  if (current) {
    current.description = descLines.join('\n').trim();
    sections.push(current);
  }

  return sections.filter((s) => s.codeBlock);
}
