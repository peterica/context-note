// Extract all [[wikilinks]] from markdown content
const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g;

export interface WikiLink {
  raw: string;       // e.g. "rag-platform/design"
  resolved: string;  // e.g. "rag-platform/design.md"
}

export function extractWikiLinks(content: string): WikiLink[] {
  const links: WikiLink[] = [];
  let match;
  while ((match = WIKILINK_REGEX.exec(content)) !== null) {
    const raw = match[1].trim();
    const resolved = raw.endsWith('.md') ? raw : `${raw}.md`;
    links.push({ raw, resolved });
  }
  return links;
}

// Build a reverse index: for each file, list which files link to it
export function buildBacklinkIndex(
  files: { id: string; content: string }[]
): Map<string, string[]> {
  const index = new Map<string, string[]>();

  for (const file of files) {
    const links = extractWikiLinks(file.content);
    for (const link of links) {
      const target = link.resolved;
      const existing = index.get(target) || [];
      if (!existing.includes(file.id)) {
        existing.push(file.id);
      }
      index.set(target, existing);
    }
  }

  return index;
}

// Render wikilinks in HTML (for preview mode)
export function renderWikiLinks(html: string, existingFiles: Set<string>): string {
  return html.replace(WIKILINK_REGEX, (_, raw: string) => {
    const trimmed = raw.trim();
    const resolved = trimmed.endsWith('.md') ? trimmed : `${trimmed}.md`;
    const exists = existingFiles.has(resolved);
    const className = exists
      ? 'wikilink wikilink-exists'
      : 'wikilink wikilink-broken';
    return `<a href="#" class="${className}" data-wikilink="${resolved}">${trimmed}</a>`;
  });
}
