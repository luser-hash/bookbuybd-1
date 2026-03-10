import { NextResponse } from 'next/server';
import { getDashboardRetention } from '@/lib/server/dashboard-store';

export async function GET() {
  return NextResponse.json(getDashboardRetention());
}
