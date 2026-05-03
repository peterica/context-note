import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { safePath, projectRoot } from '@/lib/notePath';

// POST /api/folder  { project, path }
export async function POST(request: NextRequest) {
  const body = await request.json();
  const project: string = body.project;
  const folderPath: string = body.path;
  if (!project || !folderPath) {
    return NextResponse.json({ error: 'project and path required' }, { status: 400 });
  }

  try {
    const absolute = safePath(project, folderPath);
    await fs.mkdir(absolute, { recursive: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE /api/folder?project=foo&path=some-folder
export async function DELETE(request: NextRequest) {
  const project = request.nextUrl.searchParams.get('project');
  const folderPath = request.nextUrl.searchParams.get('path');
  if (!project || !folderPath) {
    return NextResponse.json({ error: 'project and path required' }, { status: 400 });
  }

  try {
    const absolute = safePath(project, folderPath);
    if (absolute === projectRoot(project)) {
      return NextResponse.json({ error: 'Cannot delete project root' }, { status: 400 });
    }
    await fs.rm(absolute, { recursive: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }
}
