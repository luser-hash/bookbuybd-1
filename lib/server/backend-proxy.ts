import { NextResponse } from 'next/server';

const DEFAULT_BACKEND_ORIGIN = process.env.NODE_ENV === 'development'
  ? 'http://127.0.0.1:8000'
  : '';

function normalizeBackendOrigin(rawOrigin: string | undefined): string {
  const trimmed = rawOrigin?.trim();
  if (!trimmed) return DEFAULT_BACKEND_ORIGIN;
  return trimmed.replace(/\/api\/?$/i, '').replace(/\/$/, '');
}

function buildBackendApiUrl(path: string): string | null {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const origin = normalizeBackendOrigin(process.env.BACKEND_ORIGIN);
  if (!origin) return null;
  return `${origin}/api${normalizedPath}`;
}

async function readUpstreamBody(upstream: Response): Promise<unknown> {
  const contentType = upstream.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return upstream.json();
  }

  const text = await upstream.text();
  return text ? { message: text } : null;
}

export async function proxyBackendGet(path: string) {
  const url = buildBackendApiUrl(path);
  if (!url) {
    return NextResponse.json(
      { message: 'Backend origin is not configured. Set BACKEND_ORIGIN in environment variables.' },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    const body = await readUpstreamBody(upstream);

    if (!upstream.ok) {
      const fallback = { message: `Upstream request failed with status ${upstream.status}.` };
      return NextResponse.json((body as object | null) ?? fallback, { status: upstream.status });
    }

    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { message: 'Failed to reach backend service.' },
      { status: 502 },
    );
  }
}

function buildProxyHeaders(request: Request): Headers {
  const headers = new Headers({ Accept: 'application/json' });
  const authorization = request.headers.get('authorization');
  const cookie = request.headers.get('cookie');
  const contentType = request.headers.get('content-type');

  if (authorization) {
    headers.set('Authorization', authorization);
  }

  if (cookie) {
    headers.set('Cookie', cookie);
  }

  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  return headers;
}

async function readProxyRequestBody(request: Request): Promise<BodyInit | undefined> {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;
  const body = await request.arrayBuffer();
  return body.byteLength > 0 ? body : undefined;
}

function buildProxyResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  const contentType = upstream.headers.get('content-type');

  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  const typedHeaders = upstream.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof typedHeaders.getSetCookie === 'function') {
    typedHeaders.getSetCookie().forEach((cookie) => {
      headers.append('Set-Cookie', cookie);
    });
  } else {
    const setCookie = upstream.headers.get('set-cookie');
    if (setCookie) {
      headers.append('Set-Cookie', setCookie);
    }
  }

  return headers;
}

export async function proxyBackendRequest(request: Request, path: string) {
  const url = buildBackendApiUrl(path);
  if (!url) {
    return NextResponse.json(
      { message: 'Backend origin is not configured. Set BACKEND_ORIGIN in environment variables.' },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers: buildProxyHeaders(request),
      body: await readProxyRequestBody(request),
      cache: 'no-store',
    });

    if (upstream.status === 204 || upstream.status === 205 || upstream.status === 304) {
      return new NextResponse(null, {
        status: upstream.status,
        headers: buildProxyResponseHeaders(upstream),
      });
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: buildProxyResponseHeaders(upstream),
    });
  } catch {
    return NextResponse.json(
      { message: 'Failed to reach backend service.' },
      { status: 502 },
    );
  }
}
