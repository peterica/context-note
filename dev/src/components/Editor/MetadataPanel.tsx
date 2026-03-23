'use client';

import { useMemo, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { parseFrontMatter, serializeFrontMatter, FrontMatter } from '@/lib/frontmatter';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  done: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  archived: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
};

export default function MetadataPanel() {
  const { editorContent, updateContent } = useStore();
  const [tagInput, setTagInput] = useState('');

  const { meta, body } = useMemo(() => parseFrontMatter(editorContent), [editorContent]);
  const hasMeta = Object.keys(meta).length > 0;

  const updateMeta = useCallback((updates: Partial<FrontMatter>) => {
    const newMeta = { ...meta, ...updates };
    updateContent(serializeFrontMatter(newMeta, body));
  }, [meta, body, updateContent]);

  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (!tag) return;
    const current = Array.isArray(meta.tags) ? meta.tags : [];
    if (!current.includes(tag)) {
      updateMeta({ tags: [...current, tag] });
    }
    setTagInput('');
  }, [tagInput, meta.tags, updateMeta]);

  const removeTag = useCallback((tag: string) => {
    const current = Array.isArray(meta.tags) ? meta.tags : [];
    updateMeta({ tags: current.filter((t) => t !== tag) });
  }, [meta.tags, updateMeta]);

  if (!hasMeta) return null;

  const statusClass = STATUS_COLORS[String(meta.status || '').toLowerCase()] || STATUS_COLORS.draft;

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border bg-sidebar-bg text-xs overflow-x-auto">
      {/* Status */}
      {meta.status && (
        <span className={`px-2 py-0.5 rounded border text-[10px] uppercase tracking-wide ${statusClass}`}>
          {String(meta.status)}
        </span>
      )}

      {/* Owner */}
      {meta.owner && (
        <span className="text-gray-500">
          <span className="text-gray-600">owner:</span> {String(meta.owner)}
        </span>
      )}

      {/* Tags */}
      <div className="flex items-center gap-1 flex-wrap">
        {Array.isArray(meta.tags) && meta.tags.map((tag) => (
          <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px]">
            #{tag}
            <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-red-400">×</button>
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder="+tag"
          className="w-14 px-1 py-0.5 bg-transparent text-[10px] text-gray-500 outline-none placeholder-gray-600"
        />
      </div>
    </div>
  );
}
