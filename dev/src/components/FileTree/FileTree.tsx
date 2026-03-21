'use client';

import { useStore } from '@/store/useStore';
import TreeNode from './TreeNode';

export default function FileTree() {
  const { tree } = useStore();

  return (
    <aside className="w-60 min-w-60 h-screen bg-sidebar-bg border-r border-border overflow-y-auto">
      <div className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-border">
        Context Navigator
      </div>
      <div className="py-1">
        {tree.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} />
        ))}
      </div>
    </aside>
  );
}
