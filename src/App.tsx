import { useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import AmiShell from './features/chat/components/ami/AmiShell'
import { onUnauthorized, setToken } from './lib/api-client'
import { useAmiTheme } from './hooks/use-ami-theme'
import {
  amiLoginUrl,
  bunSignInUrl,
  cleanHandoffFromUrl,
  exchangeHandoffCode,
  getHandoffCode,
} from './lib/sso'

const queryClient = new QueryClient()

function LoginScreen({ error, themeClass }: { error: string | null; themeClass: string }) {
  return (
    <div className={`${themeClass} flex min-h-screen items-center justify-center bg-[var(--ami-bg)] p-4`}>
      <div className="w-full max-w-sm space-y-4 rounded-3xl bg-[var(--ami-surface)] p-8 text-center">
        <h1 className="ami-gradient-text text-3xl font-medium">AMI Asisten</h1>
        <p className="text-sm text-[var(--ami-muted)]">
          Masuk lewat portal Arumanis — tanpa password tambahan di sini.
        </p>
        {error && <p className="text-sm text-[var(--ami-danger)]">{error}</p>}
        <button
          type="button"
          onClick={() => window.location.replace(bunSignInUrl(amiLoginUrl()))}
          className="w-full rounded-full bg-[var(--ami-text)] px-3 py-2.5 text-sm font-medium text-[var(--ami-bg)] transition-transform hover:scale-[1.02]"
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
  const { theme, toggle } = useAmiTheme()
  const themeClass = theme === 'dark' ? 'ami-dark' : 'ami-light'

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
      <div className={`${themeClass} flex min-h-screen items-center justify-center gap-3 bg-[var(--ami-bg)] text-sm text-[var(--ami-muted)]`}>
        <Loader2 className="h-5 w-5 animate-spin" />
        Memeriksa sesi Arumanis…
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      {authed ? (
        <AmiShell theme={theme} onToggleTheme={toggle} />
      ) : (
        <LoginScreen error={ssoError} themeClass={themeClass} />
      )}
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  )
}
