/// <reference types="vite/client" />

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type RequestOptions<TBody> = {
  method?: HttpMethod;
  body?: TBody;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const envUrl = import.meta.env.VITE_API_URL;
// Fallback to the production Railway host if the env var wasn't set at build time.
const baseUrl =
  envUrl ?? (import.meta.env.MODE === 'development' ? '/api' : 'https://garage-backend-production-ee79.up.railway.app');

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = 'GET', body, signal } = options;
  // Normalize URL to avoid double slashes when baseUrl ends with a slash
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${normalizedBase}${normalizedPath}`;
  console.log('Making API request to:', url);

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    mode: 'cors',
    credentials: 'omit',
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  const data = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new ApiError((data as { message?: string })?.message ?? 'Request failed', response.status, data);
  }

  return data as TResponse;
}
