import { proxyBackendRequest } from '@/lib/server/backend-proxy';

const BACKEND_DASHBOARD_BOOKS_PATH = '/books/dashboard/';

export async function GET(request: Request) {
  return proxyBackendRequest(request, BACKEND_DASHBOARD_BOOKS_PATH);
}
