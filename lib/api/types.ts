export type QueryPrimitive = string | number | boolean | null | undefined;

export type QueryValue = QueryPrimitive | QueryPrimitive[];

export type QueryParams = object;

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  message?: string;
  detail?: string;
  code?: string;
  errors?: Record<string, string | string[]>;
  [key: string]: unknown;
}

export interface RequestOptions extends RequestInit {
  query?: QueryParams;
  timeoutMs?: number;
}

export class ApiError extends Error {
  status: number;
  body?: ApiErrorBody | string | null;

  constructor(message: string, status: number, body?: ApiErrorBody | string | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}
