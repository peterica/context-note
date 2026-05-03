import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { projectRoot } from '@/lib/notePath';

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
    .filter((e) => !e.name.startsWith('.') && e.name !== 'node_modules')
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

export async function GET(request: NextRequest) {
  const project = request.nextUrl.searchParams.get('project');
  if (!project) {
    return NextResponse.json({ error: 'project required' }, { status: 400 });
  }

  let root: string;
  try {
    root = projectRoot(project);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }

  const children = await buildTree(root, '');
  const tree: TreeNode[] = [
    {
      id: '',
      name: project.split('/').pop() || project,
      type: 'folder',
      children,
    },
  ];
  return NextResponse.json(tree);
}
