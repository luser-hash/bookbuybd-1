import { NextResponse } from 'next/server';
import { getContactMessageStatus } from '@/lib/server/contact-store';

interface RouteContext {
  params: Promise<{ messageId: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { messageId } = await context.params;
  const status = getContactMessageStatus(messageId);

  if (!status) {
    return NextResponse.json({ message: 'Contact message not found.' }, { status: 404 });
  }

  return NextResponse.json(status);
}
