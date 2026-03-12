import { proxyBackendRequest } from '@/lib/server/backend-proxy';

const BACKEND_DASHBOARD_REVENUE_PATH = '/dashboard/monthly-revenue/';

export async function GET(request: Request) {
  return proxyBackendRequest(request, BACKEND_DASHBOARD_REVENUE_PATH);
}
