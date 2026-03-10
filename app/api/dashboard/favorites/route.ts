import { NextResponse } from 'next/server';
import { getDashboardFavorites } from '@/lib/server/dashboard-store';

export async function GET() {
  return NextResponse.json(getDashboardFavorites());
}
