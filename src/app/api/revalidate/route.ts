/**
 * @file route.ts
 * @description On-Demand Revalidation API 라우트 핸들러입니다.
 * 콘텐츠 생성/수정 시 캐시를 즉시 수동 갱신하는 엔드포인트를 제공합니다.
 */

import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 시크릿 키 검증
    const secret = request.headers.get('authorization')?.replace('Bearer ', '');

    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json(
        { error: 'Invalid revalidation secret' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tag } = body;

    if (!tag || typeof tag !== 'string') {
      return NextResponse.json(
        { error: 'Tag is required' },
        { status: 400 }
      );
    }

    // Next.js 15+: revalidateTag는 런타임에 string을 받음
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (revalidateTag as any)(tag);

    return NextResponse.json(
      {
        success: true,
        message: `Cache revalidated for tag: ${tag}`,
        revalidatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}