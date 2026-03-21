import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { NOTE_ROOT } from '@/lib/notePath';

interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

async function buildTree(dirPath: string, relativePath: string): Promise<TreeNode[]> {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const nodes: TreeNode[] = [];

  // 폴더 먼저, 파일 다음 (각각 알파벳 정렬)
  const sorted = entries
    .filter((e) => !e.name.startsWith('.'))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  for (const entry of sorted) {
    const entryRelative = path.join(relativePath, entry.name);
    const entryAbsolute = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const children = await buildTree(entryAbsolute, entryRelative);
      nodes.push({
        id: entryRelative,
        name: entry.name,
        type: 'folder',
        children,
      });
    } else if (entry.name.endsWith('.md')) {
      nodes.push({
        id: entryRelative,
        name: entry.name,
        type: 'file',
      });
    }
  }

  return nodes;
}

export async function GET() {
  const children = await buildTree(NOTE_ROOT, '');
  const tree: TreeNode[] = [
    {
      id: '',
      name: 'wiki',
      type: 'folder',
      children,
    },
  ];
  return NextResponse.json(tree);
}
