import path from 'path';
import fs from 'fs/promises';

export const NOTE_ROOT = process.env.NOTE_ROOT
  ? path.resolve(process.env.NOTE_ROOT)
  : path.resolve(process.cwd(), '..', 'note');

function lexicalResolve(relativePath: string): string {
  const resolved = path.resolve(NOTE_ROOT, relativePath);
  const rel = path.relative(NOTE_ROOT, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Invalid path: traversal detected');
  }
  return resolved;
}

let realRootPromise: Promise<string> | null = null;
function getRealRoot(): Promise<string> {
  if (!realRootPromise) realRootPromise = fs.realpath(NOTE_ROOT);
  return realRootPromise;
}

// realpath 기반으로 symlink 탈출까지 차단. 파일이 아직 없으면(POST/PUT 신규)
// 가장 깊은 기존 조상까지 walk-up 후 그 realpath + 남은 segment로 검증.
export async function realSafePath(relativePath: string): Promise<string> {
  const resolved = lexicalResolve(relativePath);
  const realRoot = await getRealRoot();

  let probe = resolved;
  const trailing: string[] = [];
  for (;;) {
    try {
      const realProbe = await fs.realpath(probe);
      const finalReal = trailing.length ? path.join(realProbe, ...trailing) : realProbe;
      const r = path.relative(realRoot, finalReal);
      if (r.startsWith('..') || path.isAbsolute(r)) {
        throw new Error('Invalid path: symlink traversal detected');
      }
      return resolved;
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') throw err;
      const parent = path.dirname(probe);
      if (parent === probe) {
        throw new Error('Invalid path');
      }
      trailing.unshift(path.basename(probe));
      probe = parent;
    }
  }
}
