import { proxyBackendRequest } from '@/lib/server/backend-proxy';

function toBackendPath(request: Request): string {
  const url = new URL(request.url);
  return `${url.pathname.replace(/^\/api/, '')}${url.search}`;
}

export async function GET(request: Request) {
  return proxyBackendRequest(request, toBackendPath(request));
}

export async function POST(request: Request) {
  return proxyBackendRequest(request, toBackendPath(request));
}

export async function PUT(request: Request) {
  return proxyBackendRequest(request, toBackendPath(request));
}

export async function PATCH(request: Request) {
  return proxyBackendRequest(request, toBackendPath(request));
}

export async function DELETE(request: Request) {
  return proxyBackendRequest(request, toBackendPath(request));
}
