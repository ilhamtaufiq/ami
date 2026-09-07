import { useState } from 'react'
import {
  Check,
  Copy,
  EllipsisVertical,
  Loader2,
  Pencil,
  RotateCcw,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wrench,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import type { AmiChat, AmiMessage } from '../../hooks/useAmiChat'

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
      <p className="mt-2 text-xl text-[#9aa0a6] sm:text-2xl">Ada yang bisa Ami bantu?</p>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="rounded-2xl bg-[#1e1f20] p-4 text-left transition-colors hover:bg-[#2f3033]"
          >
            <span className="block text-sm text-[#e3e3e3]">{s.label}</span>
            <span className="mt-1 line-clamp-2 block text-xs text-[#9aa0a6]">{s.prompt}</span>
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
        <div className="w-full max-w-[85%] rounded-3xl bg-[#2f3033] p-2 sm:max-w-[75%]">
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
            className="w-full resize-none bg-transparent p-3 text-[15px] leading-relaxed text-[#e3e3e3] outline-none"
          />
          <div className="flex justify-end gap-2 px-2 pb-1">
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setDraft(content)
              }}
              className="rounded-full px-3 py-1.5 text-sm text-[#c4c7c5] hover:bg-[#3f4043]"
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
              className="rounded-full bg-[#e3e3e3] px-4 py-1.5 text-sm font-medium text-[#131314] disabled:opacity-40"
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
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl bg-[#2f3033] px-5 py-3 text-[15px] leading-relaxed text-[#e3e3e3] sm:max-w-[75%]">
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
          className="mt-2 rounded-full p-2 text-[#9aa0a6] opacity-0 transition-opacity hover:bg-[#2f3033] hover:text-white group-hover/user:opacity-100"
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
    <div className="relative my-3 overflow-hidden rounded-xl bg-[#0d0d0f]">
      <div className="flex items-center justify-between px-4 py-2 text-xs text-[#9aa0a6]">
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
          className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Disalin' : 'Copy code'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 pt-0 text-[13px] leading-relaxed text-[#e3e3e3]">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function ModelBubble({ msg, chat }: { msg: AmiMessage; chat: AmiChat }) {
  const [copied, setCopied] = useState(false)
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const copyText = () => {
    navigator.clipboard.writeText(msg.content).then(
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
        <div className="ami-markdown text-[15px] leading-8 text-[#e3e3e3]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ children, className }) => {
                const text = String(children ?? '')
                const match = /language-(\w+)/.exec(className ?? '')
                if (!text.includes('\n')) {
                  return <code className="rounded bg-[#2f3033] px-1.5 py-0.5 text-[13px]">{children}</code>
                }
                return <CodeBlock code={text.replace(/\n$/, '')} lang={match?.[1]} />
              },
              pre: ({ children }) => <>{children}</>,
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#8ab4f8] hover:underline">
                  {children}
                </a>
              ),
            }}
          >
            {msg.content}
          </ReactMarkdown>
        </div>

        {msg.tool_calls && msg.tool_calls.length > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#9aa0a6]">
            <Wrench className="h-3.5 w-3.5" />
            {msg.tool_calls.length} sumber data: {msg.tool_calls.map((t) => t.function.name.replaceAll('_', ' ')).join(', ')}
          </p>
        )}

        {msg.content && !chat.isLoading && (
          <div className="mt-1 flex items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
            <button
              type="button"
              title="Bagus"
              onClick={() => vote('up')}
              className={`rounded-full p-2 transition-colors hover:bg-[#2f3033] ${voted === 'up' ? 'text-white' : 'text-[#9aa0a6]'}`}
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Kurang"
              onClick={() => vote('down')}
              className={`rounded-full p-2 transition-colors hover:bg-[#2f3033] ${voted === 'down' ? 'text-white' : 'text-[#9aa0a6]'}`}
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Bagikan"
              onClick={() => toast.info('Bagikan menyusul')}
              className="rounded-full p-2 text-[#9aa0a6] transition-colors hover:bg-[#2f3033] hover:text-white"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Salin teks"
              onClick={copyText}
              className="rounded-full p-2 text-[#9aa0a6] transition-colors hover:bg-[#2f3033] hover:text-white"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <div className="relative">
              <button
                type="button"
                title="Lainnya"
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-full p-2 text-[#9aa0a6] transition-colors hover:bg-[#2f3033] hover:text-white"
              >
                <EllipsisVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute left-0 z-40 w-44 overflow-hidden rounded-xl bg-[#2f3033] py-1 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        chat.regenerateLast()
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-[#e3e3e3] hover:bg-[#3f4043]"
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
          <ModelBubble key={i} msg={msg} chat={chat} />
        ) : null,
      )}
      {isLoading && (
        <div className="flex items-center gap-3" aria-live="polite">
          <Sparkles className="ami-gradient-icon h-6 w-6 animate-pulse" />
          <span className="text-sm italic text-[#9aa0a6]">{statusMessage ?? 'Menyiapkan jawaban...'}</span>
        </div>
      )}
      {isLoading && toolTrace.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {toolTrace.map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center gap-1 rounded-full bg-[#2f3033] px-2.5 py-1 text-[11px] text-[#9aa0a6]"
            >
              <Wrench className="h-3 w-3" />
              {tool.replaceAll('_', ' ')}
            </span>
          ))}
        </div>
      )}
      {isLoading && !statusMessage && (
        <Loader2 className="h-5 w-5 animate-spin text-[#9aa0a6]" />
      )}
    </div>
  )
}
