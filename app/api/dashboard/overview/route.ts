import { NextResponse } from 'next/server';
import { getDashboardOverview } from '@/lib/server/dashboard-store';

export async function GET() {
  return NextResponse.json(getDashboardOverview());
}
