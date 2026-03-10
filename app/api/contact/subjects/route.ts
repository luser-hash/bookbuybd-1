import { NextResponse } from 'next/server';
import { getContactSubjects } from '@/lib/server/contact-store';

export async function GET() {
  return NextResponse.json(getContactSubjects());
}
