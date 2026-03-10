import { NextResponse } from 'next/server';
import { getDashboardLeads } from '@/lib/server/dashboard-store';

export async function GET() {
  return NextResponse.json(getDashboardLeads());
}
