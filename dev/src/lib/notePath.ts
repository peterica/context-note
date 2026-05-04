import path from 'path';
import fs from 'fs/promises';

// WORKSPACE_ROOT: 모든 프로젝트의 부모 디렉터리.
// 컨테이너에선 /workspace 로 마운트, 로컬 dev에선 ../workspace 기본값.
export const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT
  ? path.resolve(process.env.WORKSPACE_ROOT)
  : path.resolve(process.cwd(), '..', 'workspace');

function isInside(parent: string, child: string): boolean {
  return child === parent || child.startsWith(parent + path.sep);
}

export function projectRoot(projectPath: string): string {
  if (typeof projectPath !== 'string' || projectPath.length === 0) {
    throw new Error('project required');
  }
  const resolved = path.resolve(WORKSPACE_ROOT, projectPath);
  if (resolved === WORKSPACE_ROOT) {
    throw new Error('Invalid project: must be a subdirectory of workspace');
  }
  if (!isInside(WORKSPACE_ROOT, resolved)) {
    throw new Error('Invalid project: traversal detected');
  }
  return resolved;
}

function lexicalResolve(projectPath: string, relativePath: string): string {
  const root = projectRoot(projectPath);
  const resolved = path.resolve(root, relativePath);
  if (!isInside(root, resolved)) {
    throw new Error('Invalid path: traversal detected');
  }
  return resolved;
}

const realRootCache = new Map<string, Promise<string>>();
function getRealRoot(projectPath: string): Promise<string> {
  const root = projectRoot(projectPath);
  let cached = realRootCache.get(root);
  if (!cached) {
    cached = fs.realpath(root);
    realRootCache.set(root, cached);
  }
  return cached;
}

// realpath 기반으로 symlink 탈출까지 차단. 파일이 아직 없으면(POST/PUT 신규)
// 가장 깊은 기존 조상까지 walk-up 후 그 realpath + 남은 segment로 검증.
export async function realSafePath(projectPath: string, relativePath: string = ''): Promise<string> {
  const resolved = lexicalResolve(projectPath, relativePath);
  const realRoot = await getRealRoot(projectPath);

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
