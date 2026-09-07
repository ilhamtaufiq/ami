import { useState } from 'react'
import {
  CircleHelp,
  Clock3,
  EllipsisVertical,
  Menu,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AmiSession } from '../../hooks/useAmiChat'

interface AmiSidebarProps {
  open: boolean
  collapsed: boolean
  sessions: AmiSession[]
  activeSessionId: number | null
  loadingSessions: boolean
  onToggle: () => void
  onCollapse: () => void
  onNewChat: () => void
  onSelect: (id: number) => void
  onDelete: (id: number) => void
  onRename: (id: number, title: string) => void
}

function groupSessions(sessions: AmiSession[]): Array<{ label: string; items: AmiSession[] }> {
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const weekAgo = startToday - 6 * 86400000
  const today: AmiSession[] = []
  const week: AmiSession[] = []
  const older: AmiSession[] = []
  for (const s of sessions) {
    const t = new Date(s.updated_at_raw || s.updated_at).getTime()
    if (Number.isNaN(t) || t >= startToday) today.push(s)
    else if (t >= weekAgo) week.push(s)
    else older.push(s)
  }
  const groups: Array<{ label: string; items: AmiSession[] }> = []
  if (today.length) groups.push({ label: 'Hari Ini', items: today })
  if (week.length) groups.push({ label: '7 Hari Lalu', items: week })
  if (older.length) groups.push({ label: 'Lebih Lama', items: older })
  return groups
}

function SessionRow({
  session,
  active,
  onSelect,
  onDelete,
  onRename,
}: {
  session: AmiSession
  active: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (title: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(session.title)

  if (renaming) {
    return (
      <form
        className="flex items-center gap-1 rounded-full bg-[var(--ami-bubble)] px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (draft.trim()) onRename(draft.trim())
          setRenaming(false)
          setMenuOpen(false)
        }}
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setRenaming(false)
            setMenuOpen(false)
          }}
          className="w-full bg-transparent text-sm text-[var(--ami-text)] outline-none"
        />
      </form>
    )
  }

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer items-center gap-2 rounded-full py-2 pl-4 pr-2 text-sm transition-colors',
        active ? 'bg-[var(--ami-bubble)] text-[var(--ami-text)]' : 'text-[var(--ami-text2)] hover:bg-[var(--ami-bubble)]/70',
      )}
      onClick={onSelect}
      title={session.title}
    >
      <span className="flex-1 truncate">{session.title}</span>
      <div className="relative">
        <button
          type="button"
          aria-label="Opsi percakapan"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((v) => !v)
          }}
          className={cn(
            'rounded-full p-1.5 text-[var(--ami-text2)] hover:bg-[var(--ami-hover)] hover:text-[var(--ami-text)]',
            menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          )}
        >
          <EllipsisVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
            <div className="absolute right-0 z-40 w-40 overflow-hidden rounded-xl bg-[var(--ami-bubble)] py-1 shadow-xl">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setDraft(session.title)
                  setRenaming(true)
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-[var(--ami-text)] hover:bg-[var(--ami-hover)]"
              >
                <Pencil className="h-4 w-4" /> Rename
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onDelete()
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-[var(--ami-danger)] hover:bg-[var(--ami-hover)]"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AmiSidebar(props: AmiSidebarProps) {
  const { open, collapsed, sessions, activeSessionId, loadingSessions } = props
  const groups = groupSessions(sessions)

  return (
    <>
      {/* overlay mobile */}
      <div
        onClick={props.onToggle}
        className={cn(
          'fixed inset-0 z-30 bg-black/60 transition-opacity md:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col bg-[var(--ami-surface)] transition-transform duration-300 md:static md:z-auto',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed && 'md:w-[72px]',
        )}
      >
        {/* bar atas: hamburger + (logo saat expanded) */}
        <div className="flex h-16 items-center gap-1 px-3">
          <button
            type="button"
            onClick={props.onToggle}
            aria-label="Toggle menu"
            className="rounded-full p-2.5 text-[var(--ami-text2)] transition-colors hover:bg-[var(--ami-bubble)]"
          >
            <Menu className="h-5 w-5" />
          </button>
          {!collapsed && (
            <span className="flex items-center gap-2 px-1 text-[15px] text-[var(--ami-text2)]">
              <Sparkles className="ami-gradient-icon h-5 w-5" />
              <span className="hidden md:inline">AMI Asisten</span>
            </span>
          )}
        </div>

        {/* chat baru */}
        <div className="px-3 pb-2">
          {collapsed ? (
            <button
              type="button"
              onClick={props.onNewChat}
              aria-label="Chat baru"
              title="Chat baru"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ami-bubble)] text-[var(--ami-text)] transition-colors hover:bg-[var(--ami-hover)]"
            >
              <Plus className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={props.onNewChat}
              className="flex h-10 items-center gap-2 rounded-full bg-[var(--ami-bubble)] px-4 text-sm text-[var(--ami-text)] transition-colors hover:bg-[var(--ami-hover)]"
            >
              <Plus className="h-4 w-4" />
              Chat Baru
            </button>
          )}
        </div>

        {/* histori */}
        {!collapsed && (
          <nav className="flex-1 overflow-y-auto px-3 pb-2">
            {loadingSessions && sessions.length === 0 ? (
              <div className="space-y-2 px-1 pt-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-9 animate-pulse rounded-full bg-[var(--ami-bubble)]/70" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <p className="px-2 pt-6 text-center text-[13px] text-[var(--ami-muted)]">Belum ada riwayat</p>
            ) : (
              groups.map((g) => (
                <div key={g.label} className="pt-4">
                  <p className="px-4 pb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--ami-muted)]">
                    {g.label}
                  </p>
                  <div className="space-y-0.5">
                    {g.items.map((s) => (
                      <SessionRow
                        key={s.id}
                        session={s}
                        active={s.id === activeSessionId}
                        onSelect={() => props.onSelect(s.id)}
                        onDelete={() => props.onDelete(s.id)}
                        onRename={(title) => props.onRename(s.id, title)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </nav>
        )}
        {collapsed && <div className="flex-1" />}

        {/* footer */}
        <div className="space-y-0.5 px-3 pb-4 pt-2">
          {[
            { icon: CircleHelp, label: 'Bantuan' },
            { icon: Clock3, label: 'Aktivitas' },
            { icon: Settings, label: 'Setelan' },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              title={label}
              className={cn(
                'flex w-full items-center gap-3 rounded-full py-2 text-sm text-[var(--ami-text2)] transition-colors hover:bg-[var(--ami-bubble)]/70',
                collapsed ? 'justify-center px-0' : 'px-4',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && label}
            </button>
          ))}
          {/* collapse toggle desktop */}
          <button
            type="button"
            onClick={props.onCollapse}
            title={collapsed ? 'Expand' : 'Collapse'}
            className={cn(
              'hidden w-full items-center gap-3 rounded-full py-2 text-sm text-[var(--ami-text2)] transition-colors hover:bg-[var(--ami-bubble)]/70 md:flex',
              collapsed ? 'justify-center px-0' : 'px-4',
            )}
          >
            <Menu className="h-5 w-5 shrink-0 rotate-90" />
            {!collapsed && 'Ciutkan'}
          </button>
        </div>
      </aside>
    </>
  )
}
