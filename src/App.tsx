import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import ChatPage from './features/chat/components/chat-page'
import { setToken } from './lib/api-client'

const queryClient = new QueryClient()

function LoginForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const base = (import.meta.env.VITE_APIAMIS_BASE_URL ?? 'http://apiamis.test/api').replace(/\/$/, '')
      const res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.message || 'Login gagal')
      const token = payload?.token ?? payload?.data?.token
      if (!token) throw new Error('Token tidak ditemukan di respons login')
      setToken(token)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border p-6">
        <h1 className="text-xl font-semibold">AMI Asisten AI</h1>
        <p className="text-sm text-muted-foreground">Masuk dengan akun arumanis.</p>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? 'Masuk...' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('ami-token'))
  return (
    <QueryClientProvider client={queryClient}>
      {authed ? <ChatPage /> : <LoginForm onDone={() => setAuthed(true)} />}
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  )
}
