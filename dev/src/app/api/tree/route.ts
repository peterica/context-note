import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { NOTE_ROOT } from '@/lib/notePath';
import { ZONES, ZONE_LABEL, type Zone } from '@/lib/zones';

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

  // 폴더 먼저, 파일 다음 (각각 알파벳 정렬)
  const sorted = entries
    .filter((e) => !e.name.startsWith('.'))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  const nodes: TreeNode[] = [];
  for (const entry of sorted) {
    const entryRelative = relativePath ? path.join(relativePath, entry.name) : entry.name;
    const entryAbsolute = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      nodes.push({
        id: entryRelative,
        name: entry.name,
        type: 'folder',
        children: await buildTree(entryAbsolute, entryRelative),
      });
    } else if (entry.name.endsWith('.md')) {
      nodes.push({ id: entryRelative, name: entry.name, type: 'file' });
    }
  }
  return nodes;
}

async function buildZoneRoot(zone: Zone): Promise<TreeNode> {
  const zoneDir = path.join(NOTE_ROOT, zone);
  const children = await buildTree(zoneDir, zone);
  return { id: zone, name: ZONE_LABEL[zone], type: 'folder', children };
}

export async function GET() {
  const tree: TreeNode[] = [];
  for (const zone of ZONES) {
    tree.push(await buildZoneRoot(zone));
  }
  return NextResponse.json(tree);
}
