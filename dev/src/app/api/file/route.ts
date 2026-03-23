import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { NOTE_ROOT, safePath } from '@/lib/notePath';

// GET /api/file?path=rag-platform/design.md
export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get('path');
  if (!filePath) {
    return NextResponse.json({ error: 'path required' }, { status: 400 });
  }

  try {
    const absolute = safePath(filePath);
    const content = await fs.readFile(absolute, 'utf-8');
    return NextResponse.json({ path: filePath, content });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

// PUT /api/file  { path, content }
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { path: filePath, content } = body;
  if (!filePath || content === undefined) {
    return NextResponse.json({ error: 'path and content required' }, { status: 400 });
  }

  try {
    const absolute = safePath(filePath);
    await fs.writeFile(absolute, content, 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/file  { path }  — 새 파일 생성 (기본 템플릿)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const filePath: string = body.path;
  if (!filePath) {
    return NextResponse.json({ error: 'path required' }, { status: 400 });
  }

  const name = filePath.endsWith('.md') ? filePath : `${filePath}.md`;

  try {
    const absolute = safePath(name);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, '', { flag: 'wx' }); // wx = fail if exists
    return NextResponse.json({ ok: true, path: name });
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'EEXIST') {
      return NextResponse.json({ error: 'File already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE /api/file?path=rag-platform/design.md
export async function DELETE(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get('path');
  if (!filePath) {
    return NextResponse.json({ error: 'path required' }, { status: 400 });
  }

  try {
    const absolute = safePath(filePath);
    await fs.unlink(absolute);

    // 부모 디렉토리가 비었으면 삭제 (NOTE_ROOT 자체는 유지)
    const dir = path.dirname(absolute);
    if (dir !== NOTE_ROOT) {
      const remaining = await fs.readdir(dir);
      if (remaining.length === 0) {
        await fs.rmdir(dir);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
