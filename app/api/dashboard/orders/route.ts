import { proxyBackendRequest } from '@/lib/server/backend-proxy';

const BACKEND_DASHBOARD_ORDERS_PATH = '/orders/dashboard/list/';

export async function GET(request: Request) {
  return proxyBackendRequest(request, BACKEND_DASHBOARD_ORDERS_PATH);
}
