# PR1 — Manual Regression Checklist

- Branch: `feature/pr1-zone-skeleton`
- Scope: Zone skeleton + compatibility layer (no physical migration, no LLM/diff/UI redesign).
- Use this checklist to verify zero regression on the existing edit/save/move/delete/search/backlink flows after merging the source-code commits of PR1.

> Test runner is not configured for this project. This file is the
> authoritative manual gate that the source-code changes are
> regression-free. Mark each item once verified locally.

---

## How to run

```bash
cd dev
npm install        # if not done
npm run dev        # http://localhost:3000
```

For API contract checks, hit the endpoints with `curl` or via the UI.

---

## A. Tree API contract (curl)

| # | Scenario | Expected |
|---|---------|----------|
| A1 | `GET /api/tree` returns exactly four roots in order `inbox, wiki, sources, system` | ☐ |
| A2 | Empty zones (`inbox`, `sources`, `system` on a fresh repo) have `children: []` | ☐ |
| A3 | `WIKI_VIRTUAL_FALLBACK=true`: pre-existing root entries (e.g. `_atlas-guide.md`, `rag-platform/`) appear under the `wiki` root | ☐ |
| A4 | Legacy ids are preserved without a `wiki/` prefix (e.g. `rag-platform/design.md`, not `wiki/rag-platform/design.md`) | ☐ |

## B. Write-side zone enforcement (curl)

| # | Scenario | Expected |
|---|---------|----------|
| B1 | `POST /api/file {path:'foo.md'}` | 400 with the prefix hint |
| B2 | `POST /api/file {path:'wiki/foo.md'}` | 200 |
| B3 | `POST /api/folder {path:'badroot'}` | 400 |
| B4 | `POST /api/folder {path:'inbox/x'}` | 200 |
| B5 | `PUT /api/rename {to:'foo.md'}` | 400 |
| B6 | `PUT /api/rename {to:'wiki/_atlas-guide.md'}` (legacy → zone) | 200 |
| B7 | `POST /api/file {path:'../etc/passwd'}` (traversal) | 400, file is not created |
| B8 | `PUT /api/file {path:'_atlas-guide.md', content:...}` (legacy save) | 200 (compat) |
| B9 | `POST /api/file {path:'rag-platform/__test.md'}` (write under existing legacy folder) | 200 (compat) |

## C. Editor regression (browser UI)

| # | Scenario | Expected |
|---|---------|----------|
| C1 | Open `_atlas-guide.md` from the tree → content renders | ☐ |
| C2 | Edit body → autosave indicator → reload → content persists | ☐ |
| C3 | Open `rag-platform/design.md` (legacy nested) → renders | ☐ |
| C4 | Frontmatter document’s metadata panel renders and saves | ☐ |

## D. Tree CRUD per zone (browser UI)

| # | Scenario | Expected |
|---|---------|----------|
| D1 | Hover `inbox` root → `+ New File` → name → file appears under `inbox/` | ☐ |
| D2 | Hover `wiki` root → `+ New Folder` → folder appears under `wiki/` | ☐ |
| D3 | Hover `sources` root → `+ New File` → file appears under `sources/` | ☐ |
| D4 | Hover `system` root → `+ New File` → file appears under `system/` | ☐ |
| D5 | Add a file under legacy `rag-platform/` (compat) | ☐ |
| D6 | Rename a zone-internal file via double-click | ☐ |
| D7 | Drag `inbox/foo.md` → drop on `wiki/` (cross-zone move allowed) | ☐ |
| D8 | Delete a non-root file → tree refreshes | ☐ |
| D9 | Zone roots themselves cannot be deleted (no trash icon visible) | ☐ |

## E. Initial expansion / view

| # | Scenario | Expected |
|---|---------|----------|
| E1 | First load: `inbox` and `wiki` are expanded by default | ☐ |
| E2 | `sources` and `system` start collapsed | ☐ |
| E3 | The empty-string root (`id: ''`) is gone | ☐ |

## F. Search, command palette, links

| # | Scenario | Expected |
|---|---------|----------|
| F1 | ⌘K opens command palette, recent files render | ☐ |
| F2 | Search for an existing file by name → click → opens | ☐ |
| F3 | A `[[wikilink]]` to a legacy file resolves and navigates | ☐ |
| F4 | Backlink panel surfaces both legacy and zone-prefixed paths | ☐ |

---

## Known limitations recorded for follow-up

- Snapshot of a NOTE_ROOT-direct legacy file (e.g. `_atlas-guide.md`) is
  blocked because the snapshot artifact would land at the root, which
  is not a writeable zone. Snapshots inside legacy folders work. Will
  resolve naturally after PR2.5 (legacy → wiki migration).
- Server returns 400 with a message on zone violations, but the client
  has no toast surface for it; users only see the failure in the
  network tab. A small follow-up PR can add a toast channel.

---

## Sign-off

- [ ] All API contract rows (A, B) passed via curl
- [ ] All UI rows (C–F) passed via browser
- [ ] No physical changes under `note/` other than directories created
      on first zone use
