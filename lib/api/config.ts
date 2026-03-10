const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || '/api';

export const API_BASE_URL = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

export const API_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 10000);

