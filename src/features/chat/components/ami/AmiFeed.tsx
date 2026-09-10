import { useState } from 'react'
import {
  Check,
  Copy,
  EllipsisVertical,
  FileDown,
  Loader2,
  Pencil,
  Printer,
  RotateCcw,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wrench,
  Zap,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { BUN_URL } from '@/lib/sso'
import type { AmiChat, AmiMessage } from '../../hooks/useAmiChat'
import { suggestFollowUps } from '../../hooks/useAmiChat'
import { ChatChart } from '../ChatChart'
import { X } from 'lucide-react'

// Blok ```json {"type":"chart",...} dari jawaban AI → chart, teks lain dipertahankan.
function extractCharts(content: string): Array<{ data: unknown; chart_type: string }> {
  const charts: Array<{ data: unknown; chart_type: string }> = []
  const blockRegex = /```json\n([\s\S]*?)\n```/g
  let m: RegExpExecArray | null
  while ((m = blockRegex.exec(content)) !== null) {
    try {
      const data = JSON.parse(m[1]) as { type?: string; chart_type?: string; data?: unknown }
      if (data.type === 'chart' && Array.isArray(data.data)) {
        charts.push({ data: data.data, chart_type: data.chart_type || 'bar' })
      }
    } catch {
      /* blok invalid dilewati, teks dipertahankan */
    }
  }
  return charts
}

function stripChartBlocks(content: string): string {
  return content.replace(/```json\n[\s\S]*?\n```/g, '').trim()
}

const SUGGESTIONS = [
  { label: 'Detail kontrak paket', prompt: 'Tampilkan detail kontrak paket terbaru' },
  { label: 'Paket belum 100%', prompt: 'Paket apa saja yang progres fisiknya belum 100%?' },
  { label: 'Laporan PDF paket', prompt: 'Buatkan laporan PDF paket terbaru' },
  { label: 'Peringkat pengawas', prompt: 'Bagaimana peringkat KPI pengawas?' },
]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 19) return 'Selamat sore'
  return 'Selamat malam'
}

function EmptyState({ userName, onPick }: { userName: string | null; onPick: (p: string) => void }) {
  const name = userName?.split(' ')[0]
  return (
    <div className="flex h-full flex-col justify-center px-6 py-10">
      <h1 className="ami-gradient-text max-w-2xl text-4xl font-medium leading-tight sm:text-5xl">
        {greeting()}{name ? `, ${name}` : ''}
      </h1>
      <p className="mt-2 text-xl text-[var(--ami-muted)] sm:text-2xl">Ada yang bisa Ami bantu?</p>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="rounded-2xl bg-[var(--ami-surface)] p-4 text-left transition-colors hover:bg-[var(--ami-bubble)]"
          >
            <span className="block text-sm text-[var(--ami-text)]">{s.label}</span>
            <span className="mt-1 line-clamp-2 block text-xs text-[var(--ami-muted)]">{s.prompt}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function UserBubble({
  content,
  disabled,
  onEdit,
}: {
  content: string
  disabled: boolean
  onEdit: (next: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  if (editing) {
    return (
      <div className="flex justify-end">
        <div className="w-full max-w-[85%] rounded-3xl bg-[var(--ami-bubble)] p-2 sm:max-w-[75%]">
          <textarea
            value={draft}
            rows={3}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (draft.trim()) {
                  setEditing(false)
                  onEdit(draft.trim())
                }
              }
              if (e.key === 'Escape') {
                setEditing(false)
                setDraft(content)
              }
            }}
            className="w-full resize-none bg-transparent p-3 text-[15px] leading-relaxed text-[var(--ami-text)] outline-none"
          />
          <div className="flex justify-end gap-2 px-2 pb-1">
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setDraft(content)
              }}
              className="rounded-full px-3 py-1.5 text-sm text-[var(--ami-text2)] hover:bg-[var(--ami-hover)]"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!draft.trim() || disabled}
              onClick={() => {
                if (draft.trim()) {
                  setEditing(false)
                  onEdit(draft.trim())
                }
              }}
              className="rounded-full bg-[var(--ami-text)] px-4 py-1.5 text-sm font-medium text-[var(--ami-bg)] disabled:opacity-40"
            >
              Kirim
            </button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="group/user flex items-start justify-end gap-1">
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl bg-[var(--ami-bubble)] px-5 py-3 text-[15px] leading-relaxed text-[var(--ami-text)] sm:max-w-[75%]">
        {content}
      </div>
      {!disabled && (
        <button
          type="button"
          title="Sunting & kirim ulang"
          onClick={() => {
            setDraft(content)
            setEditing(true)
          }}
          className="mt-2 rounded-full p-2 text-[var(--ami-muted)] opacity-0 transition-opacity hover:bg-[var(--ami-bubble)] hover:text-[var(--ami-text)] group-hover/user:opacity-100"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative my-3 overflow-hidden rounded-xl bg-[var(--ami-codebg)]">
      <div className="flex items-center justify-between px-4 py-2 text-xs text-[var(--ami-muted)]">
        <span>{lang || 'code'}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(code).then(
              () => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              },
              () => toast.error('Gagal menyalin'),
            )
          }}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-white/10 hover:text-[var(--ami-text)]"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Disalin' : 'Copy code'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 pt-0 text-[13px] leading-relaxed text-[var(--ami-text)]">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function formatIdr(value: number): string {
  return 'Rp' + value.toLocaleString('id-ID', { maximumFractionDigits: 2 })
}

function UsageBadge({ msg }: { msg: AmiMessage }) {
  const total = msg.tokens_used ?? (msg.prompt_tokens ?? 0) + (msg.completion_tokens ?? 0)
  const show = msg.instant || total > 0 || msg.cost_idr != null || msg.cached
  if (!show) return null
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--ami-muted)]">
      {msg.instant ? (
        <span
          title="Jawaban langsung dari database — 0 token, tanpa AI"
          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-400"
        >
          <Zap className="h-3 w-3" />
          Instan · 0 token
        </span>
      ) : (
        <span title={`In ${msg.prompt_tokens ?? 0} · Out ${msg.completion_tokens ?? 0}`}>
          ↑{(msg.prompt_tokens ?? total).toLocaleString()} ↓{(msg.completion_tokens ?? 0).toLocaleString()}
        </span>
      )}
      {msg.cost_idr != null && !msg.instant && <span>· {formatIdr(msg.cost_idr)}</span>}
      {msg.cached && !msg.instant && <span>· cached</span>}
      {msg.model && !msg.instant && <span>· {msg.model.split('/').pop()}</span>}
    </p>
  )
}

function ModelBubble({
  msg,
  chat,
  onImage,
}: {
  msg: AmiMessage
  chat: AmiChat
  onImage: (src: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const charts = extractCharts(msg.content)
  const displayText = charts.length > 0 ? stripChartBlocks(msg.content) : msg.content

  const copyText = () => {
    navigator.clipboard.writeText(displayText).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
        toast.success('Disalin')
      },
      () => toast.error('Gagal menyalin'),
    )
  }

  const vote = (v: 'up' | 'down') => {
    setVoted(v)
    if (msg.id) chat.voteMessage(msg.id, v)
  }

  return (
    <div className="group flex gap-3">
      <Sparkles className="ami-gradient-icon mt-1 h-6 w-6 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="ami-markdown text-[15px] leading-8 text-[var(--ami-text)]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ children, className }) => {
                const text = String(children ?? '')
                const match = /language-(\w+)/.exec(className ?? '')
                if (!text.includes('\n')) {
                  return <code className="rounded bg-[var(--ami-bubble)] px-1.5 py-0.5 text-[13px]">{children}</code>
                }
                return <CodeBlock code={text.replace(/\n$/, '')} lang={match?.[1]} />
              },
              pre: ({ children }) => <>{children}</>,
              img: ({ src }) =>
                typeof src === 'string' ? (
                  // eslint-disable-next-line jsx-a11y/alt-text, jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
                  <img
                    loading="lazy"
                    src={src}
                    onClick={() => onImage(src)}
                    className="my-2 max-h-64 w-auto cursor-zoom-in rounded-xl border border-[var(--ami-hover)]"
                  />
                ) : null,
              a: ({ href, children }) => {
                const to = typeof href === 'string' ? href : ''
                // Tautan laporan PDF dari tool AI → tombol unduh langsung.
                if (/^\/chat\/reports\/download/.test(to)) {
                  return (
                    <button
                      type="button"
                      onClick={async () => {
                        toast.info('Menyiapkan laporan PDF...')
                        const { downloadBffPdf, buildBffApiUrl } = await import('@/lib/download-file')
                        const err = await downloadBffPdf(buildBffApiUrl(to))
                        if (err) toast.error(err)
                        else toast.success('Laporan PDF terunduh')
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ami-bubble)] px-4 py-2 text-sm text-[var(--ami-text)] transition-colors hover:bg-[var(--ami-hover)]"
                    >
                      <FileDown className="h-4 w-4" />
                      {children}
                    </button>
                  )
                }
                // Path relative (mis. /pekerjaan/632) = halaman arumanis, bukan AMI.
                const url = /^https?:\/\//.test(to) ? to : `${BUN_URL}${to}`
                return (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-[var(--ami-link)] hover:underline">
                    {children}
                  </a>
                )
              },
            }}
          >
            {displayText}
          </ReactMarkdown>
        </div>

        {charts.map((chart, idx) => (
          <div key={idx} className="mt-3 w-full">
            <ChatChart
              data={chart.data as any[]}
              type={chart.chart_type as 'bar' | 'pie' | 'line'}
            />
          </div>
        ))}

        {msg.tool_calls && msg.tool_calls.length > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--ami-muted)]">
            <Wrench className="h-3.5 w-3.5" />
            {msg.tool_calls.length} sumber data: {msg.tool_calls.map((t) => t.function.name.replaceAll('_', ' ')).join(', ')}
          </p>
        )}
        <UsageBadge msg={msg} />

        {msg.content && !chat.isLoading && (
          <div className="mt-1 flex items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
            <button
              type="button"
              title="Bagus"
              onClick={() => vote('up')}
              className={`rounded-full p-2 transition-colors hover:bg-[var(--ami-bubble)] ${voted === 'up' ? 'text-white' : 'text-[var(--ami-muted)]'}`}
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Kurang"
              onClick={() => vote('down')}
              className={`rounded-full p-2 transition-colors hover:bg-[var(--ami-bubble)] ${voted === 'down' ? 'text-white' : 'text-[var(--ami-muted)]'}`}
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Unduh markdown"
              onClick={() => {
                const blob = new Blob([displayText], { type: 'text/markdown' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `ami-jawaban-${Date.now()}.md`
                document.body.appendChild(a)
                a.click()
                a.remove()
                URL.revokeObjectURL(url)
                toast.success('Markdown terunduh')
              }}
              className="rounded-full p-2 text-[var(--ami-muted)] transition-colors hover:bg-[var(--ami-bubble)] hover:text-[var(--ami-text)]"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Salin teks"
              onClick={copyText}
              className="rounded-full p-2 text-[var(--ami-muted)] transition-colors hover:bg-[var(--ami-bubble)] hover:text-[var(--ami-text)]"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              type="button"
              title="Unduh PDF (kop Disperkim)"
              onClick={async () => {
                try {
                  const { exportAnswerPdf } = await import('../../lib/export-answer-pdf')
                  await exportAnswerPdf(displayText, 'Tanya AMI')
                } catch {
                  toast.error('Gagal membuat PDF')
                }
              }}
              className="rounded-full p-2 text-[var(--ami-muted)] transition-colors hover:bg-[var(--ami-bubble)] hover:text-[var(--ami-text)]"
            >
              <Printer className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                type="button"
                title="Lainnya"
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-full p-2 text-[var(--ami-muted)] transition-colors hover:bg-[var(--ami-bubble)] hover:text-[var(--ami-text)]"
              >
                <EllipsisVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute left-0 z-40 w-44 overflow-hidden rounded-xl bg-[var(--ami-bubble)] py-1 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        chat.regenerateLast()
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-[var(--ami-text)] hover:bg-[var(--ami-hover)]"
                    >
                      <RotateCcw className="h-4 w-4" /> Coba lagi
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AmiFeed({ chat }: { chat: AmiChat }) {
  const { messages, isLoading, statusMessage, toolTrace, userName } = chat
  const [lightbox, setLightbox] = useState<string | null>(null)

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && m.content)
  const followUps =
    !isLoading && lastAssistant ? suggestFollowUps(stripChartBlocks(lastAssistant.content)) : []

  if (messages.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1">
        <EmptyState userName={userName} onPick={(p) => chat.handleSend(p)} />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-7 px-4 py-6 sm:px-6">
      {messages.map((msg, i) =>
        msg.role === 'user' ? (
          <UserBubble
            key={i}
            content={msg.content}
            disabled={isLoading}
            onEdit={(next) => chat.handleSend(next)}
          />
        ) : msg.content ? (
          <ModelBubble key={i} msg={msg} chat={chat} onImage={setLightbox} />
        ) : null,
      )}
      {followUps.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {followUps.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => chat.handleSend(s)}
              className="rounded-full border border-[var(--ami-hover)] bg-[var(--ami-surface)] px-3.5 py-1.5 text-xs text-[var(--ami-text2)] transition-colors hover:bg-[var(--ami-bubble)] hover:text-[var(--ami-text)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau foto"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setLightbox(null)
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            src={lightbox}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            title="Tutup"
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-black hover:bg-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {isLoading && (
        <div className="flex items-center gap-3" aria-live="polite">
          <Sparkles className="ami-gradient-icon h-6 w-6 animate-pulse" />
          <span className="text-sm italic text-[var(--ami-muted)]">{statusMessage ?? 'Menyiapkan jawaban...'}</span>
        </div>
      )}
      {isLoading && toolTrace.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {toolTrace.map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--ami-bubble)] px-2.5 py-1 text-[11px] text-[var(--ami-muted)]"
            >
              <Wrench className="h-3 w-3" />
              {tool.replaceAll('_', ' ')}
            </span>
          ))}
        </div>
      )}
      {isLoading && !statusMessage && (
        <Loader2 className="h-5 w-5 animate-spin text-[var(--ami-muted)]" />
      )}
    </div>
  )
}
