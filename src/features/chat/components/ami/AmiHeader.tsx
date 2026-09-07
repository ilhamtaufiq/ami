import { useState } from 'react'
import { Check, ChevronDown, Menu, Moon, Sparkles, Sun, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import api from '@/lib/api-client'
import { AMI_PROVIDERS, type SessionTotals } from '../../hooks/useAmiChat'

interface AmiHeaderProps {
  provider: string
  onProvider: (value: string) => void
  userName: string | null
  totals: SessionTotals
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onMenu: () => void
  onLogout: () => void
}

function formatIdr(value: number): string {
  return 'Rp' + value.toLocaleString('id-ID', { maximumFractionDigits: 2 })
}

export default function AmiHeader({ provider, onProvider, userName, totals, theme, onToggleTheme, onMenu, onLogout }: AmiHeaderProps) {
  const [open, setOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [passOpen, setPassOpen] = useState(false)
  const [newPass, setNewPass] = useState('')
  const [passLoading, setPassLoading] = useState(false)

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    setPassLoading(true)
    try {
      await api.put('/auth/profile', { password: newPass })
      toast.success('Password diganti')
      setNewPass('')
      setPassOpen(false)
      setUserOpen(false)
    } catch {
      toast.error('Gagal mengganti password')
    } finally {
      setPassLoading(false)
    }
  }
  const active = AMI_PROVIDERS.find((p) => p.value === provider) ?? AMI_PROVIDERS[0]
  const initial = (userName ?? 'A').trim().charAt(0).toUpperCase() || 'A'

  return (
    <header className="flex h-16 shrink-0 items-center gap-1 px-3 sm:px-4">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Menu"
        className="rounded-full p-2.5 text-[var(--ami-text2)] transition-colors hover:bg-[var(--ami-bubble)] md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* switcher model */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[15px] text-[var(--ami-text)] transition-colors hover:bg-[var(--ami-bubble)]"
        >
          <Sparkles className="ami-gradient-icon h-4 w-4" />
          {active.label}
          <ChevronDown className={cn('h-4 w-4 text-[var(--ami-muted)] transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full z-40 mt-1 w-64 overflow-hidden rounded-2xl bg-[var(--ami-bubble)] py-1.5 shadow-xl">
              {AMI_PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => {
                    onProvider(p.value)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--ami-hover)]"
                >
                  <span className="flex-1">
                    <span className="block text-sm text-[var(--ami-text)]">{p.label}</span>
                    <span className="block text-xs text-[var(--ami-muted)]">{p.hint}</span>
                  </span>
                  {p.value === provider && <Check className="h-4 w-4 text-[var(--ami-text)]" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onToggleTheme}
        title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
        aria-label="Ganti tema"
        className="rounded-full p-2.5 text-[var(--ami-text2)] transition-colors hover:bg-[var(--ami-bubble)]"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {totals.tokens > 0 && (
        <span
          className="mr-1 hidden items-center gap-1 text-[11px] text-[var(--ami-muted)] sm:flex"
          title={
            totals.hasPricing
              ? `In ${totals.prompt.toLocaleString()} · Out ${totals.completion.toLocaleString()} · Estimasi biaya sesi ini`
              : 'Tarif belum diset di pengaturan AI'
          }
        >
          <Zap className="h-3 w-3" />↑{totals.prompt.toLocaleString()} ↓{totals.completion.toLocaleString()}
          {totals.hasPricing && <span className="font-semibold text-[var(--ami-text)]">· {formatIdr(totals.cost)}</span>}
        </span>
      )}

      {/* avatar */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setUserOpen((v) => !v)}
          aria-label="Akun"
          title={userName ?? 'Akun'}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7b1fa2] text-sm font-medium text-white transition-transform hover:scale-105"
        >
          {initial}
        </button>
        {userOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setUserOpen(false)} />
            <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-2xl bg-[var(--ami-bubble)] py-1.5 shadow-xl">
              <p className="truncate px-4 py-2 text-sm text-[var(--ami-text)]">{userName ?? 'Pengguna AMI'}</p>
              <button
                type="button"
                onClick={() => setPassOpen((v) => !v)}
                className="flex w-full items-center px-4 py-2.5 text-left text-sm text-[var(--ami-text)] transition-colors hover:bg-[var(--ami-hover)]"
              >
                Ganti password
              </button>
              {passOpen && (
                <form onSubmit={changePassword} className="space-y-2 px-4 py-2">
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Password baru (min 6)"
                    minLength={6}
                    required
                    className="w-full rounded-lg bg-[var(--ami-surface)] px-3 py-2 text-sm text-[var(--ami-text)] outline-none placeholder:text-[var(--ami-muted)]"
                  />
                  <button
                    type="submit"
                    disabled={passLoading}
                    className="w-full rounded-lg bg-[var(--ami-text)] py-1.5 text-sm font-medium text-[var(--ami-bg)] disabled:opacity-50"
                  >
                    {passLoading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </form>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center px-4 py-2.5 text-left text-sm text-[var(--ami-text)] transition-colors hover:bg-[var(--ami-hover)]"
              >
                Keluar
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
