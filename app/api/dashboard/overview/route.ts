import { proxyBackendRequest } from '@/lib/server/backend-proxy';

const BACKEND_DASHBOARD_OVERVIEW_PATH = '/dashboard/overview/';

export async function GET(request: Request) {
  return proxyBackendRequest(request, BACKEND_DASHBOARD_OVERVIEW_PATH);
}
