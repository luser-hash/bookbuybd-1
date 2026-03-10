import { NextResponse } from 'next/server';
import { getDashboardBooks } from '@/lib/server/dashboard-store';

export async function GET() {
  return NextResponse.json(getDashboardBooks());
}
