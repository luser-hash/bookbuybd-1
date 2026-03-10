import { NextResponse } from 'next/server';
import { getDashboardRevenue } from '@/lib/server/dashboard-store';

export async function GET() {
  return NextResponse.json(getDashboardRevenue());
}
