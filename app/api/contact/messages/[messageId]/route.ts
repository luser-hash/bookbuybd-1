import { NextResponse } from 'next/server';
import { getContactMessageStatus } from '@/lib/server/contact-store';

interface RouteContext {
  params: Promise<{ messageId: string }>;
}

function hasTokenAuth(request: Request): boolean {
  const auth = request.headers.get('authorization') ?? '';
  return /^token\s+\S+/i.test(auth.trim());
}

export async function GET(request: Request, context: RouteContext) {
  if (!hasTokenAuth(request)) {
    return NextResponse.json(
      { message: 'Authentication credentials were not provided.' },
      { status: 401 },
    );
  }

  const { messageId } = await context.params;
  const status = getContactMessageStatus(messageId);

  if (!status) {
    return NextResponse.json({ message: 'Contact message not found.' }, { status: 404 });
  }

  return NextResponse.json(status);
}
