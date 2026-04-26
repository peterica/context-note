export const ZONES = ['inbox', 'wiki', 'sources', 'system'] as const;
export type Zone = (typeof ZONES)[number];

// Legacy 호환 모드: note/ 직속의 비-zone 항목을 wiki 루트의 가상 자식으로 노출하고,
// 동일 경로의 쓰기(POST/rename to)도 한시적으로 허용한다.
// PR2.5(legacy 마이그레이션)에서 false로 전환한다.
export const WIKI_VIRTUAL_FALLBACK = true;

export const ZONE_LABEL: Record<Zone, string> = {
  inbox: 'inbox',
  wiki: 'wiki',
  sources: 'sources',
  system: 'system',
};

export const ZONE_ORDER: Record<Zone, number> = {
  inbox: 0,
  wiki: 1,
  sources: 2,
  system: 3,
};

export function isZone(value: string): value is Zone {
  return (ZONES as readonly string[]).includes(value);
}

export function parseZone(relPath: string): Zone | null {
  if (!relPath) return null;
  const first = relPath.split('/')[0];
  return isZone(first) ? first : null;
}

export function firstSegment(relPath: string): string {
  if (!relPath) return '';
  return relPath.split('/')[0];
}
