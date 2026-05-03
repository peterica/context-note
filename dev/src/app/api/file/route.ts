import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { projectRoot, safePath } from '@/lib/notePath';

function getProjectAndPath(request: NextRequest): { project: string; path: string } | null {
  const project = request.nextUrl.searchParams.get('project');
  const filePath = request.nextUrl.searchParams.get('path');
  if (!project || !filePath) return null;
  return { project, path: filePath };
}

// GET /api/file?project=foo&path=design.md
export async function GET(request: NextRequest) {
  const params = getProjectAndPath(request);
  if (!params) {
    return NextResponse.json({ error: 'project and path required' }, { status: 400 });
  }

  try {
    const absolute = safePath(params.project, params.path);
    const content = await fs.readFile(absolute, 'utf-8');
    return NextResponse.json({ path: params.path, content });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

// PUT /api/file  { project, path, content }
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { project, path: filePath, content } = body;
  if (!project || !filePath || content === undefined) {
    return NextResponse.json({ error: 'project, path and content required' }, { status: 400 });
  }

  try {
    const absolute = safePath(project, filePath);
    await fs.writeFile(absolute, content, 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/file  { project, path }  — 새 파일 생성 (빈 내용)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const project: string = body.project;
  const filePath: string = body.path;
  if (!project || !filePath) {
    return NextResponse.json({ error: 'project and path required' }, { status: 400 });
  }

  const name = filePath.endsWith('.md') ? filePath : `${filePath}.md`;

  try {
    const absolute = safePath(project, name);
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

// DELETE /api/file?project=foo&path=design.md
export async function DELETE(request: NextRequest) {
  const params = getProjectAndPath(request);
  if (!params) {
    return NextResponse.json({ error: 'project and path required' }, { status: 400 });
  }

  try {
    const absolute = safePath(params.project, params.path);
    const root = projectRoot(params.project);
    await fs.unlink(absolute);

    // 부모 디렉토리가 비었으면 삭제 (project root 자체는 유지)
    const dir = path.dirname(absolute);
    if (dir !== root) {
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
