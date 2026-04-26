import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { safePath, NOTE_ROOT, assertWriteablePath, ZoneViolationError } from '@/lib/notePath';

// POST /api/folder  { path }
// 신규 폴더는 zone prefix를 강제(legacy 호환은 assertWriteablePath 내부 규칙).
export async function POST(request: NextRequest) {
  const body = await request.json();
  const folderPath: string = body.path;
  if (!folderPath) {
    return NextResponse.json({ error: 'path required' }, { status: 400 });
  }

  try {
    const absolute = await assertWriteablePath(folderPath);
    await fs.mkdir(absolute, { recursive: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ZoneViolationError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE /api/folder?path=some-folder
export async function DELETE(request: NextRequest) {
  const folderPath = request.nextUrl.searchParams.get('path');
  if (!folderPath) {
    return NextResponse.json({ error: 'path required' }, { status: 400 });
  }

  try {
    const absolute = safePath(folderPath);
    if (absolute === NOTE_ROOT) {
      return NextResponse.json({ error: 'Cannot delete root' }, { status: 400 });
    }
    await fs.rm(absolute, { recursive: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }
}
