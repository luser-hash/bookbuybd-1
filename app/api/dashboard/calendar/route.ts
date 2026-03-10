import { NextResponse } from 'next/server';
import { getDashboardCalendar } from '@/lib/server/dashboard-store';

export async function GET() {
  return NextResponse.json(getDashboardCalendar());
}
