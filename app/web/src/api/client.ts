import { request } from "./request";

export function get<TResponse>(
  url: string,
  params?: Record<string, string>,
  query?: Record<string, string | number | undefined>,
): Promise<TResponse> {
  return request<TResponse>("GET", url, params, null, query);
}

export function post<TResponse>(
  url: string,
  body: BodyInit | null,
  params?: Record<string, string>,
  query?: Record<string, string | number | undefined>,
): Promise<TResponse> {
  return request<TResponse>("POST", url, params, body, query);
}

export function patch<TResponse>(
  url: string,
  body: BodyInit | null,
  params?: Record<string, string>,
  query?: Record<string, string | number | undefined>,
): Promise<TResponse> {
  return request<TResponse>("PATCH", url, params, body, query);
}

export function del<TResponse>(
  url: string,
  params?: Record<string, string>,
  query?: Record<string, string | number | undefined>,
): Promise<TResponse> {
  return request<TResponse>("DELETE", url, params, null, query);
}
