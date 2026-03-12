import { proxyBackendRequest } from '@/lib/server/backend-proxy';

const BACKEND_ORDERS_PATH = '/orders/';

export async function GET(request: Request) {
  return proxyBackendRequest(request, BACKEND_ORDERS_PATH);
}

export async function POST(request: Request) {
  return proxyBackendRequest(request, BACKEND_ORDERS_PATH);
}
