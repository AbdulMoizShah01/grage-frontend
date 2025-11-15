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

const trimTrailingSlash = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const envBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_URL);
const defaultBaseUrl = '/api';
const baseUrl = envBaseUrl ?? defaultBaseUrl;

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = 'GET', body, signal } = options;

  const url = path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;

  const response = await fetch(url, {
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
