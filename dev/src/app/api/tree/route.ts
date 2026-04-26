import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { NOTE_ROOT } from '@/lib/notePath';
import { ZONES, ZONE_LABEL, WIKI_VIRTUAL_FALLBACK, isZone, type Zone } from '@/lib/zones';

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

/**
 * NOTE_ROOT 직속에서 zone 디렉터리가 아닌 항목들을 legacy로 수집한다.
 * id는 원본 그대로(예: `_atlas-guide.md`, `rag-platform/design.md`)를 유지해
 * selectedFileId/wikilink/backlink 회귀를 방지한다.
 */
async function collectLegacyChildren(): Promise<TreeNode[]> {
  let entries;
  try {
    entries = await fs.readdir(NOTE_ROOT, { withFileTypes: true });
  } catch {
    return [];
  }

  const sorted = entries
    .filter((e) => !e.name.startsWith('.'))
    .filter((e) => !isZone(e.name))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  const nodes: TreeNode[] = [];
  for (const entry of sorted) {
    const entryAbsolute = path.join(NOTE_ROOT, entry.name);
    if (entry.isDirectory()) {
      nodes.push({
        id: entry.name,
        name: entry.name,
        type: 'folder',
        children: await buildTree(entryAbsolute, entry.name),
      });
    } else if (entry.name.endsWith('.md')) {
      nodes.push({ id: entry.name, name: entry.name, type: 'file' });
    }
  }
  return nodes;
}

async function buildZoneRoot(zone: Zone): Promise<TreeNode> {
  const zoneDir = path.join(NOTE_ROOT, zone);
  const zoneChildren = await buildTree(zoneDir, zone);

  if (zone === 'wiki' && WIKI_VIRTUAL_FALLBACK) {
    const legacy = await collectLegacyChildren();
    // legacy 항목을 wiki 자식으로 가상 노출. 폴더 우선, 알파벳 순으로 병합.
    const merged = [...legacy, ...zoneChildren].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
    return { id: zone, name: ZONE_LABEL[zone], type: 'folder', children: merged };
  }

  return { id: zone, name: ZONE_LABEL[zone], type: 'folder', children: zoneChildren };
}

export async function GET() {
  const tree: TreeNode[] = [];
  for (const zone of ZONES) {
    tree.push(await buildZoneRoot(zone));
  }
  return NextResponse.json(tree);
}
