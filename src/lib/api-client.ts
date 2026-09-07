import { ApiError } from './api-client.types'

export { ApiError } from './api-client.types'

const API_BASE = (import.meta.env.VITE_APIAMIS_BASE_URL ?? 'http://apiamis.test/api').replace(/\/$/, '')

function token(): string | null {
  return localStorage.getItem('ami-token')
}

type RequestOptions = {
  params?: Record<string, string | number | undefined>
  headers?: Record<string, string | undefined>
  responseType?: 'json' | 'blob'
}

async function request<T>(method: string, endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  let url = `${API_BASE}${endpoint}`
  if (options.params) {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(options.params)) {
      if (v !== undefined && v !== null) sp.append(k, String(v))
    }
    const qs = sp.toString()
    if (qs) url += `?${qs}`
  }
  const headers: Record<string, string> = {
    Accept: options.responseType === 'blob' ? '*/*' : 'application/json',
    ...options.headers,
  }
  const t = token()
  if (t) headers.Authorization = `Bearer ${t}`
  let requestBody: BodyInit | undefined
  if (body instanceof FormData) {
    requestBody = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    requestBody = JSON.stringify(body)
  }
  const response = await fetch(url, { method, headers, body: requestBody })
  if (options.responseType === 'blob') {
    if (!response.ok) throw new ApiError(response.statusText || 'Request failed', response.status)
    return (await response.blob()) as unknown as T
  }
  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(
      (data as { message?: string })?.message || response.statusText || 'Request failed',
      response.status,
      data,
    )
  }
  return data as T
}

const api = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', endpoint, undefined, options)
  },
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', endpoint, body, options)
  },
  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PUT', endpoint, body, options)
  },
  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PATCH', endpoint, body, options)
  },
  delete<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('DELETE', endpoint, body, options)
  },
}

export function setToken(t: string | null) {
  if (t) localStorage.setItem('ami-token', t)
  else localStorage.removeItem('ami-token')
}

export function apiBaseUrl(): string {
  return API_BASE
}

export default api
