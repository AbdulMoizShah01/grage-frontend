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
const isBrowser = typeof window !== 'undefined';
const isAbsoluteUrl = (value?: string) => !!value && /^https?:\/\//i.test(value);

const resolveBaseUrl = () => {
  if (!envBaseUrl) {
    return defaultBaseUrl;
  }

  if (!isBrowser || !isAbsoluteUrl(envBaseUrl)) {
    return envBaseUrl;
  }

  try {
    const envOrigin = new URL(envBaseUrl).origin;
    if (import.meta.env.PROD && envOrigin !== window.location.origin) {
      // In production, prefer the same-origin /api path so Vercel's rewrite avoids CORS.
      return defaultBaseUrl;
    }
  } catch {
    return defaultBaseUrl;
  }

  return envBaseUrl;
};

const baseUrl = resolveBaseUrl();

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
