import { proxyBackendRequest } from '@/lib/server/backend-proxy';

const BACKEND_CONTACT_MESSAGES_PATH = '/contact/messages/';

export async function GET(request: Request) {
  return proxyBackendRequest(request, BACKEND_CONTACT_MESSAGES_PATH);
}

export async function POST(request: Request) {
  return proxyBackendRequest(request, BACKEND_CONTACT_MESSAGES_PATH);
}
