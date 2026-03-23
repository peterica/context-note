export interface FrontMatter {
  status?: string;
  owner?: string;
  tags?: string[];
  [key: string]: unknown;
}

const FM_REGEX = /^---\n([\s\S]*?)\n---\n?/;

export function parseFrontMatter(content: string): { meta: FrontMatter; body: string } {
  const match = content.match(FM_REGEX);
  if (!match) return { meta: {}, body: content };

  const yamlBlock = match[1];
  const body = content.slice(match[0].length);
  const meta: FrontMatter = {};

  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();

    if (!key) continue;

    // Parse array: [a, b, c]
    if (value.startsWith('[') && value.endsWith(']')) {
      meta[key] = value.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      meta[key] = value;
    }
  }

  return { meta, body };
}

export function serializeFrontMatter(meta: FrontMatter, body: string): string {
  const entries = Object.entries(meta).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return body;

  const lines = entries.map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: [${value.join(', ')}]`;
    }
    return `${key}: ${value}`;
  });

  return `---\n${lines.join('\n')}\n---\n${body}`;
}

export function hasFrontMatter(content: string): boolean {
  return FM_REGEX.test(content);
}
