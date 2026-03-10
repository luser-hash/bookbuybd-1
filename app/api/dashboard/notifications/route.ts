import { NextResponse } from 'next/server';
import { getDashboardNotifications } from '@/lib/server/dashboard-store';

export async function GET() {
  return NextResponse.json(getDashboardNotifications());
}
