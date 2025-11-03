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

const baseUrl = import.meta.env.VITE_API_URL ?? '/api';

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = 'GET', body, signal } = options;
  const url = `${baseUrl}${path}`;
  console.log('Making API request to:', url);

    const response = await fetch(`${baseUrl}${path}`, {
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
