import { proxyBackendGet } from '@/lib/server/backend-proxy';

export async function GET() {
  return proxyBackendGet('/search/trending');
}
