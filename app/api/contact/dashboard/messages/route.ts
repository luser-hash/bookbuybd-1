import { NextResponse } from 'next/server';
import { listContactMessages } from '@/lib/server/contact-store';

function hasTokenAuth(request: Request): boolean {
  const auth = request.headers.get('authorization') ?? '';
  return /^token\s+\S+/i.test(auth.trim());
}

export async function GET(request: Request) {
  if (!hasTokenAuth(request)) {
    return NextResponse.json(
      { message: 'Authentication credentials were not provided.' },
      { status: 401 },
    );
  }

  return NextResponse.json(listContactMessages());
}
