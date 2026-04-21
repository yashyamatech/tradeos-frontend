const BASE = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const KEY = () => process.env.NEXT_PUBLIC_BACKEND_API_KEY ?? '';

function authHeaders(extra?: HeadersInit): Record<string, string> {
  const key = KEY();
  return {
    'Content-Type': 'application/json',
    ...(key ? { 'X-API-Key': key } : {}),
    ...(extra as Record<string, string>),
  };
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return window.fetch(`${BASE()}${path}`, {
    ...init,
    headers: authHeaders(init?.headers),
    cache: (init?.cache as RequestCache) ?? 'no-store',
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }
  return res.json();
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T = any>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};
