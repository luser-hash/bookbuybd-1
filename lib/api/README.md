# API Integration Structure

This folder is the shared API layer for frontend-backend integration.

## Folder layout

- `config.ts`: API base URL and timeout configuration from env.
- `client.ts`: Shared fetch client with query support, timeout, and typed errors.
- `endpoints.ts`: Central endpoint path map.
- `contracts/*`: Request/response DTO types by domain.
- `services/*`: Domain services that call endpoints through the shared client.
- `fallback/*`: Safe fallback mappers used when backend is not ready.
- `index.ts`: Barrel exports for easy imports.

## Environment variables

Set these in `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_API_TIMEOUT_MS=10000
```

Change `NEXT_PUBLIC_API_BASE_URL` to your backend origin in production if needed.

## Example usage

```tsx
'use client';
import { useHomeSummary } from '@/hooks/useHomeSummary';

export default function HomeContainer() {
  const { data, loading, error, refresh } = useHomeSummary();

  if (loading) return <p>Loading...</p>;
  if (error) return <button onClick={refresh}>Retry</button>;
  if (!data) return null;

  return <pre>{JSON.stringify(data.heroSlides, null, 2)}</pre>;
}
```

