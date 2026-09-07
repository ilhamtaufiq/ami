import api, { apiBaseUrl } from './api-client'

const BUN_URL = (import.meta.env.VITE_BUN_URL ?? 'http://localhost:5173').replace(/\/$/, '')

export function bunSignInUrl(next?: string): string {
  const url = `${BUN_URL}/sign-in`
  return next ? `${url}?redirect=${encodeURIComponent(next)}` : url
}

export function amiLoginUrl(): string {
  return `${window.location.origin}${window.location.pathname}#/login`
}

export function getHandoffCode(): string | null {
  // Dukung ?code=… dan #/login?code=… (hash router sederhana).
  const q = new URLSearchParams(window.location.search)
  const direct = q.get('code') || q.get('handoff')
  if (direct?.trim()) return direct.trim()
  const hash = window.location.hash
  const qi = hash.indexOf('?')
  if (qi >= 0) {
    const hq = new URLSearchParams(hash.slice(qi + 1))
    const hcode = hq.get('code') || hq.get('handoff')
    if (hcode?.trim()) return hcode.trim()
  }
  return null
}

export function cleanHandoffFromUrl(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('handoff')
  const hash = url.hash
  const qi = hash.indexOf('?')
  if (qi >= 0) {
    const hq = new URLSearchParams(hash.slice(qi + 1))
    hq.delete('code')
    hq.delete('handoff')
    const rest = hq.toString()
    url.hash = hash.slice(0, qi) + (rest ? `?${rest}` : '')
  }
  window.history.replaceState(null, '', url.toString())
}

/** Tukar code handoff bun → token Sanctum. */
export async function exchangeHandoffCode(code: string): Promise<string> {
  const res = await fetch(`${apiBaseUrl()}/auth/handoff/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ code }),
  })
  const payload = await res.json().catch(() => null)
  if (!res.ok) throw new Error(payload?.message || 'Kode handoff kedaluwarsa')
  const token = payload?.token ?? payload?.data?.token
  if (!token) throw new Error('Token tidak ditemukan')
  return token as string
}

export { api }
