import { NextResponse } from 'next/server';
import { getContactInfo } from '@/lib/server/contact-store';

export async function GET() {
  return NextResponse.json(getContactInfo());
}
