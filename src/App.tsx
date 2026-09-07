import { useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import AmiShell from './features/chat/components/ami/AmiShell'
import { onUnauthorized, setToken } from './lib/api-client'
import {
  amiLoginUrl,
  bunSignInUrl,
  cleanHandoffFromUrl,
  exchangeHandoffCode,
  getHandoffCode,
} from './lib/sso'

const queryClient = new QueryClient()

function LoginScreen({ error }: { error: string | null }) {
  return (
    <div className="ami-dark flex min-h-screen items-center justify-center bg-[#131314] p-4">
      <div className="w-full max-w-sm space-y-4 rounded-3xl bg-[#1e1f20] p-8 text-center">
        <h1 className="ami-gradient-text text-3xl font-medium">AMI Asisten</h1>
        <p className="text-sm text-[#9aa0a6]">
          Masuk lewat portal Arumanis — tanpa password tambahan di sini.
        </p>
        {error && <p className="text-sm text-[#f28b82]">{error}</p>}
        <button
          type="button"
          onClick={() => window.location.replace(bunSignInUrl(amiLoginUrl()))}
          className="w-full rounded-full bg-[#e3e3e3] px-3 py-2.5 text-sm font-medium text-[#131314] transition-transform hover:scale-[1.02]"
        >
          Masuk via Arumanis
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('ami-token'))
  const [booting, setBooting] = useState(() => getHandoffCode() != null)
  const [ssoError, setSsoError] = useState<string | null>(null)
  const exchangedRef = useRef(false)

  useEffect(() => {
    onUnauthorized(() => {
      setToken(null)
      setAuthed(false)
      toast.error('Sesi berakhir — silakan masuk lagi')
    })
  }, [])

  // SSO bootstrap: ?code=… dari bun → tukar token → bersih dari URL.
  useEffect(() => {
    const code = getHandoffCode()
    if (!code || exchangedRef.current) return
    exchangedRef.current = true
    exchangeHandoffCode(code)
      .then((token) => {
        setToken(token)
        setAuthed(true)
        setSsoError(null)
        cleanHandoffFromUrl()
      })
      .catch((err) => {
        setSsoError(err instanceof Error ? err.message : 'SSO gagal')
        cleanHandoffFromUrl()
      })
      .finally(() => setBooting(false))
  }, [])

  if (booting) {
    return (
      <div className="ami-dark flex min-h-screen items-center justify-center gap-3 bg-[#131314] text-sm text-[#9aa0a6]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Memeriksa sesi Arumanis…
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      {authed ? <AmiShell /> : <LoginScreen error={ssoError} />}
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  )
}
