import path from 'path';
import fs from 'fs/promises';
import { firstSegment, isZone, WIKI_VIRTUAL_FALLBACK } from '@/lib/zones';

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

export class ZoneViolationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ZoneViolationError';
  }
}

const ZONE_PREFIX_HINT =
  'Path must start with one of: inbox/, wiki/, sources/, system/';

/**
 * 쓰기(생성/이동 대상) 경로 검증.
 *
 * 규칙:
 *  - traversal 차단(safePath)
 *  - 첫 segment가 zone이면 허용
 *  - WIKI_VIRTUAL_FALLBACK=true 일 때, 첫 segment가 NOTE_ROOT에 이미 존재하는
 *    legacy 항목(파일 또는 디렉터리)이면 허용 (회귀 방지용 호환 레이어)
 *  - 그 외는 차단
 *
 * 반환: 검증된 절대 경로
 */
export async function assertWriteablePath(relPath: string): Promise<string> {
  let absolute: string;
  try {
    absolute = safePath(relPath);
  } catch {
    throw new ZoneViolationError('Invalid path: traversal detected');
  }
  const head = firstSegment(relPath);
  if (!head) {
    throw new ZoneViolationError(ZONE_PREFIX_HINT);
  }
  if (isZone(head)) return absolute;

  if (WIKI_VIRTUAL_FALLBACK) {
    try {
      await fs.stat(path.join(NOTE_ROOT, head));
      return absolute;
    } catch {
      // not an existing legacy entry → fall through
    }
  }

  throw new ZoneViolationError(ZONE_PREFIX_HINT);
}
