import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { realSafePath } from '@/lib/notePath';

// PUT /api/rename  { project, from, to }
// 파일/폴더 이름 변경 및 이동 모두 처리
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { project, from, to } = body;
  if (!project || !from || !to) {
    return NextResponse.json({ error: 'project, from and to required' }, { status: 400 });
  }

  try {
    const fromAbsolute = await realSafePath(project, from);
    const toAbsolute = await realSafePath(project, to);

    // 대상 경로의 부모 디렉토리 생성
    await fs.mkdir(path.dirname(toAbsolute), { recursive: true });

    // 이미 존재하는지 확인
    try {
      await fs.access(toAbsolute);
      return NextResponse.json({ error: 'Target already exists' }, { status: 409 });
    } catch {
      // 존재하지 않으면 정상
    }

    await fs.rename(fromAbsolute, toAbsolute);

    // 이전 부모 디렉토리가 비었으면 정리
    const oldDir = path.dirname(fromAbsolute);
    try {
      const remaining = await fs.readdir(oldDir);
      if (remaining.length === 0) {
        await fs.rmdir(oldDir);
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
