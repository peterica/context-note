'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';

export default function LandingGuide() {
  const selectFile = useStore((s) => s.selectFile);
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

  const openGuideFile = () => {
    selectFile('_atlas-guide.md');
  };

  if (!guide) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 bg-editor-bg">
        <p>Loading guide...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-editor-bg overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* 헤더 */}
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Context Note Wiki
          </h1>
          <p className="text-gray-400">
            Atlas에게 구조화된 컨텍스트를 전달하기 위한 시스템입니다.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            좌측 파일 트리에서 문서를 선택하거나, 아래 프롬프트를 Atlas에 붙여넣어 사용하세요.
          </p>
        </div>

        {/* 빠른 시작 */}
        <div className="mb-8 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <h2 className="text-sm font-semibold text-primary mb-2">
            Quick Start
          </h2>
          <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
            <li>Atlas Side Chat을 열고 <strong>위키 구조 인식</strong> 프롬프트를 붙여넣기</li>
            <li>좌측 트리에서 작업할 문서를 선택</li>
            <li>문서 내용을 Atlas에 전달하여 분석/정리 요청</li>
          </ol>
        </div>

        {/* 프롬프트 섹션들 */}
        {guide.sections.map((section, i) => (
          <div key={i} className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3 border-b border-border pb-1">
              {section.title}
            </h2>
            {section.description && (
              <p className="text-sm text-gray-400 mb-3">{section.description}</p>
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

        {/* 푸터 */}
        <div className="mt-10 pt-4 border-t border-border text-sm text-gray-500">
          <button onClick={openGuideFile} className="text-primary hover:underline">
            _atlas-guide.md 원본 편집
          </button>
          <span className="mx-2">|</span>
          프롬프트를 수정하려면 가이드 파일을 직접 편집하세요.
        </div>
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
