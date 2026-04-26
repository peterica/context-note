import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { NOTE_ROOT, safePath, assertWriteablePath, ZoneViolationError } from '@/lib/notePath';

// GET /api/file?path=rag-platform/design.md
export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get('path');
  if (!filePath) {
    return NextResponse.json({ error: 'path required' }, { status: 400 });
  }

  let absolute: string;
  try {
    absolute = safePath(filePath);
  } catch (e) {
    if (e instanceof ZoneViolationError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const content = await fs.readFile(absolute, 'utf-8');
    return NextResponse.json({ path: filePath, content });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

// PUT /api/file  { path, content }
// 기존 파일(legacy 포함) 저장은 호환 허용,
// 신규 파일(저장 시점에 미존재) 저장은 zone prefix를 강제한다.
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { path: filePath, content } = body;
  if (!filePath || content === undefined) {
    return NextResponse.json({ error: 'path and content required' }, { status: 400 });
  }

  try {
    let absolute = safePath(filePath);

    let exists = false;
    try {
      await fs.stat(absolute);
      exists = true;
    } catch {
      // not exists → 신규 생성으로 간주
    }

    if (!exists) {
      absolute = await assertWriteablePath(filePath);
      await fs.mkdir(path.dirname(absolute), { recursive: true });
    }

    await fs.writeFile(absolute, content, 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ZoneViolationError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/file  { path }  — 새 파일 생성 (기본 템플릿)
// 신규 생성은 zone prefix를 강제(legacy 호환은 assertWriteablePath 내부 규칙).
export async function POST(request: NextRequest) {
  const body = await request.json();
  const filePath: string = body.path;
  if (!filePath) {
    return NextResponse.json({ error: 'path required' }, { status: 400 });
  }

  const name = filePath.endsWith('.md') ? filePath : `${filePath}.md`;

  try {
    const absolute = await assertWriteablePath(name);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, '', { flag: 'wx' }); // wx = fail if exists
    return NextResponse.json({ ok: true, path: name });
  } catch (e) {
    if (e instanceof ZoneViolationError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
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

  let absolute: string;
  try {
    absolute = safePath(filePath);
  } catch (e) {
    if (e instanceof ZoneViolationError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
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
