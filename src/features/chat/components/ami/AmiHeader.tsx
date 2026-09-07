import { useState } from 'react'
import { Check, ChevronDown, Menu, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AMI_PROVIDERS } from '../../hooks/useAmiChat'

interface AmiHeaderProps {
  provider: string
  onProvider: (value: string) => void
  userName: string | null
  onMenu: () => void
  onLogout: () => void
}

export default function AmiHeader({ provider, onProvider, userName, onMenu, onLogout }: AmiHeaderProps) {
  const [open, setOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const active = AMI_PROVIDERS.find((p) => p.value === provider) ?? AMI_PROVIDERS[0]
  const initial = (userName ?? 'A').trim().charAt(0).toUpperCase() || 'A'

  return (
    <header className="flex h-16 shrink-0 items-center gap-1 px-3 sm:px-4">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Menu"
        className="rounded-full p-2.5 text-[#c4c7c5] transition-colors hover:bg-[#2f3033] md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* switcher model */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[15px] text-[#e3e3e3] transition-colors hover:bg-[#2f3033]"
        >
          <Sparkles className="ami-gradient-icon h-4 w-4" />
          {active.label}
          <ChevronDown className={cn('h-4 w-4 text-[#9aa0a6] transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full z-40 mt-1 w-64 overflow-hidden rounded-2xl bg-[#2f3033] py-1.5 shadow-xl">
              {AMI_PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => {
                    onProvider(p.value)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#3f4043]"
                >
                  <span className="flex-1">
                    <span className="block text-sm text-[#e3e3e3]">{p.label}</span>
                    <span className="block text-xs text-[#9aa0a6]">{p.hint}</span>
                  </span>
                  {p.value === provider && <Check className="h-4 w-4 text-[#e3e3e3]" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex-1" />

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
            <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-2xl bg-[#2f3033] py-1.5 shadow-xl">
              <p className="truncate px-4 py-2 text-sm text-[#e3e3e3]">{userName ?? 'Pengguna AMI'}</p>
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center px-4 py-2.5 text-left text-sm text-[#e3e3e3] transition-colors hover:bg-[#3f4043]"
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
