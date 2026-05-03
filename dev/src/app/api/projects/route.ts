import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { WORKSPACE_ROOT } from '@/lib/notePath';

interface FolderNode {
  id: string; // workspace 기준 상대경로
  name: string;
  children: FolderNode[];
}

const MAX_DEPTH = 4;
const HIDDEN = new Set(['node_modules']);

async function buildFolderTree(
  dirPath: string,
  relativePath: string,
  depth: number,
): Promise<FolderNode[]> {
  if (depth >= MAX_DEPTH) return [];

  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const folders = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !HIDDEN.has(e.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const nodes: FolderNode[] = [];
  for (const entry of folders) {
    const childRel = path.join(relativePath, entry.name);
    const childAbs = path.join(dirPath, entry.name);
    const children = await buildFolderTree(childAbs, childRel, depth + 1);
    nodes.push({ id: childRel, name: entry.name, children });
  }
  return nodes;
}

export async function GET() {
  try {
    const children = await buildFolderTree(WORKSPACE_ROOT, '', 0);
    return NextResponse.json({ root: WORKSPACE_ROOT, children });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
