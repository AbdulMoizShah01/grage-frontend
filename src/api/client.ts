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

// Use proxy in local dev to avoid CORS, fall back to env or '/api' otherwise
const isLocalhost = typeof window !== 'undefined' && /^localhost(:\d+)?$/.test(window.location.hostname);
const baseUrl = isLocalhost ? '/api' : (import.meta.env.VITE_API_URL ?? '/api');

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = 'GET', body, signal } = options;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  const data = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new ApiError((data as { message?: string })?.message ?? 'Request failed', response.status, data);
  }

  return data as TResponse;
}
