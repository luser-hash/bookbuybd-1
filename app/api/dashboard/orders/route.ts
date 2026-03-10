import { NextResponse } from 'next/server';
import { getDashboardOrders } from '@/lib/server/dashboard-store';

export async function GET() {
  return NextResponse.json(getDashboardOrders());
}
