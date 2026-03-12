import { proxyBackendRequest } from '@/lib/server/backend-proxy';

const BACKEND_CONTACT_SUBJECTS_PATH = '/contact/subjects/';

export async function GET(request: Request) {
  return proxyBackendRequest(request, BACKEND_CONTACT_SUBJECTS_PATH);
}
