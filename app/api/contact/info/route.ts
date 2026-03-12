import { proxyBackendRequest } from '@/lib/server/backend-proxy';

const BACKEND_CONTACT_INFO_PATH = '/contact/info/';

export async function GET(request: Request) {
  return proxyBackendRequest(request, BACKEND_CONTACT_INFO_PATH);
}
