import { NextResponse } from 'next/server';

const DEFAULT_BACKEND_ORIGIN = 'http://127.0.0.1:8000';

function normalizeBackendOrigin(rawOrigin: string | undefined): string {
  const trimmed = rawOrigin?.trim();
  if (!trimmed) return DEFAULT_BACKEND_ORIGIN;
  return trimmed.replace(/\/api\/?$/i, '').replace(/\/$/, '');
}

function buildBackendApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const origin = normalizeBackendOrigin(process.env.BACKEND_ORIGIN);
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
  try {
    const upstream = await fetch(buildBackendApiUrl(path), {
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
