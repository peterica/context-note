import path from 'path';

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

/**
 * project (workspace 기준 상대경로) 와 그 하위 상대경로를 합쳐
 * 절대경로로 정규화하고 traversal을 차단.
 */
export function safePath(projectPath: string, relativePath: string = ''): string {
  const root = projectRoot(projectPath);
  const resolved = path.resolve(root, relativePath);
  if (!isInside(root, resolved)) {
    throw new Error('Invalid path: traversal detected');
  }
  return resolved;
}
