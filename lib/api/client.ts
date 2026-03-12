import { API_BASE_URL, API_TIMEOUT_MS } from '@/lib/api/config';
import { ApiError, type ApiEnvelope, type QueryParams, type RequestOptions } from '@/lib/api/types';

function buildUrl(path: string, query?: QueryParams, baseUrl = API_BASE_URL): string {
  const localOrigin = 'http://local.invalid';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`, localOrigin);

  if (query) {
    Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (isQueryPrimitive(item)) {
            url.searchParams.append(key, String(item));
          }
        });
        return;
      }
      if (isQueryPrimitive(value)) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.origin === localOrigin ? `${url.pathname}${url.search}` : url.toString();
}

function isJsonResponse(contentType: string | null): boolean {
  return Boolean(contentType && contentType.includes('application/json'));
}

function isLikelyHtmlDocument(value: string): boolean {
  const text = value.trim().toLowerCase();
  return text.startsWith('<!doctype html') || text.startsWith('<html');
}

function isQueryPrimitive(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function isEnvelope<T>(data: unknown): data is ApiEnvelope<T> {
  return Boolean(data && typeof data === 'object' && 'data' in data);
}

function getObjectValueAsMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string' && item.trim());
    return typeof first === 'string' ? first : null;
  }
  return null;
}

function findFirstNestedMessage(value: unknown): string | null {
  const direct = getObjectValueAsMessage(value);
  if (direct) return direct;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const nested = findFirstNestedMessage(entry);
      if (nested) return nested;
    }
    return null;
  }

  if (value && typeof value === 'object') {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      const nested = findFirstNestedMessage(entry);
      if (nested) return nested;
    }
  }

  return null;
}

function extractErrorMessage(body: unknown, status: number): string {
  if (typeof body === 'string') {
    return isLikelyHtmlDocument(body) ? `Request failed with status ${status}` : body || 'Request failed';
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const direct = getObjectValueAsMessage(record.message) || getObjectValueAsMessage(record.detail);
    if (direct) return direct;

    if (record.errors && typeof record.errors === 'object') {
      const firstError = findFirstNestedMessage(record.errors);
      if (firstError) return firstError;
    }

    const firstFieldError = Object.entries(record)
      .filter(([key]) => !['message', 'detail', 'errors', 'code'].includes(key))
      .map(([key, value]) => {
        const msg = getObjectValueAsMessage(value);
        return msg ? `${key}: ${msg}` : null;
      })
      .find(Boolean);

    if (firstFieldError) return firstFieldError;
  }

  return `Request failed with status ${status}`;
}

export class ApiClient {
  constructor(private readonly baseUrl = API_BASE_URL, private readonly timeoutMs = API_TIMEOUT_MS) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { query, timeoutMs, headers, ...rest } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs ?? this.timeoutMs);
    const url = buildUrl(path, query, this.baseUrl);

    try {
      const response = await fetch(url, {
        ...rest,
        headers: {
          Accept: 'application/json',
          ...headers,
        },
        signal: controller.signal,
      });

      const contentType = response.headers.get('content-type');
      const body = isJsonResponse(contentType)
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new ApiError(extractErrorMessage(body, response.status), response.status, body);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return isEnvelope<T>(body) ? body.data : (body as T);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      throw new ApiError((error as Error).message || 'Unknown network error', 0);
    } finally {
      clearTimeout(timer);
    }
  }

  get<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T, B = unknown>(path: string, body?: B, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  put<T, B = unknown>(path: string, body?: B, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  patch<T, B = unknown>(path: string, body?: B, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  delete<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
