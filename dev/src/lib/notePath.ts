import path from 'path';

// 환경변수 NOTE_ROOT 우선, 없으면 dev/../note 기본값
export const NOTE_ROOT = process.env.NOTE_ROOT
  ? path.resolve(process.env.NOTE_ROOT)
  : path.resolve(process.cwd(), '..', 'note');

/**
 * 상대 경로를 note/ 기준 절대 경로로 변환하되,
 * path traversal 공격을 방지합니다.
 */
export function safePath(relativePath: string): string {
  const resolved = path.resolve(NOTE_ROOT, relativePath);
  if (!resolved.startsWith(NOTE_ROOT)) {
    throw new Error('Invalid path: traversal detected');
  }
  return resolved;
}
