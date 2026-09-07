import { useCallback, useEffect, useRef, useState } from 'react'
import api from '@/lib/api-client'
import { streamChat, type ChatStreamEvent } from '../api/stream-chat'
import { toast } from 'sonner'

export interface AmiToolCall {
  id: string
  type: string
  function: { name: string; arguments: string }
}

export interface AmiMessage {
  id?: number
  role: 'user' | 'assistant'
  content: string
  tool_calls?: AmiToolCall[]
  tokens_used?: number
  prompt_tokens?: number | null
  completion_tokens?: number | null
  cost_idr?: number | null
}

export interface AmiSession {
  id: number
  title: string
  messages_count: number
  updated_at: string
  updated_at_raw: string
}

interface ChatResponse {
  success: boolean
  reply: string
  session_id: number
  model?: string
  cached?: boolean
  tool_calls?: AmiToolCall[]
  message?: string
  cost_idr?: number | null
  prompt_tokens?: number | null
  completion_tokens?: number | null
  usage?: { total_tokens: number; prompt_tokens?: number; completion_tokens?: number }
}

const STORAGE_KEY = 'ami_chat_sessions_cache'

function getCachedSessions(): AmiSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setCachedSessions(sessions: AmiSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    /* quota exceeded, ignore */
  }
}

export const AMI_PROVIDERS = [
  { value: 'local', label: 'AMI Lokal', hint: 'Default arumanis' },
  { value: 'openrouter', label: 'OpenRouter', hint: 'gpt-oss-120b' },
  { value: 'openai', label: 'OpenAI', hint: 'gpt-4o-mini' },
  { value: 'gemini', label: 'Gemini', hint: '2.5-flash-lite' },
  { value: 'deepseek', label: 'DeepSeek', hint: 'deepseek-chat' },
  { value: 'groq', label: 'Groq', hint: 'llama-3.3-70b' },
  { value: 'mistral', label: 'Mistral', hint: 'mistral-small' },
] as const

export function useAmiChat() {
  const [messages, setMessages] = useState<AmiMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessions, setSessions] = useState<AmiSession[]>(() => getCachedSessions())
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [toolTrace, setToolTrace] = useState<string[]>([])
  const [provider, setProvider] = useState<string>(() => localStorage.getItem('ami_provider') ?? 'local')
  const [currentModel, setCurrentModel] = useState<string | null>(() => localStorage.getItem('ami_last_model'))
  const [userName, setUserName] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)

  useEffect(() => {
    const el = scrollRef.current
    if (el && stickToBottomRef.current) el.scrollTop = el.scrollHeight
  }, [messages, statusMessage])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }, [])

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true)
    try {
      const res = await api.get<{ success: boolean; data: AmiSession[] }>('/chat/sessions')
      if (res.success) {
        setSessions(res.data)
        setCachedSessions(res.data)
      }
    } catch {
      /* cached fallback */
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    api
      .get<{ data?: { name?: string }; name?: string }>('/auth/me')
      .then((res) => setUserName(res.data?.name ?? res.name ?? null))
      .catch(() => setUserName(null))
  }, [fetchSessions])

  const loadSession = useCallback(async (sessionId: number) => {
    try {
      const res = await api.get<{ success: boolean; data: { messages: AmiMessage[] } }>(
        `/chat/sessions/${sessionId}/messages`,
      )
      if (res.success) {
        setMessages(res.data.messages)
        setActiveSessionId(sessionId)
      }
    } catch {
      toast.error('Gagal memuat percakapan')
    }
  }, [])

  const createNewSession = useCallback(() => {
    setMessages([])
    setActiveSessionId(null)
    setStatusMessage(null)
    setToolTrace([])
  }, [])

  const deleteSession = useCallback(
    async (sessionId: number) => {
      try {
        await api.delete(`/chat/sessions/${sessionId}`)
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
        if (activeSessionId === sessionId) createNewSession()
        toast.success('Percakapan dihapus')
      } catch {
        toast.error('Gagal menghapus')
      }
    },
    [activeSessionId, createNewSession],
  )

  const voteMessage = useCallback(async (messageId: number, vote: 'up' | 'down') => {
    try {
      await api.post(`/chat/messages/${messageId}/vote`, { vote })
      toast.success(vote === 'up' ? 'Dicatat sebagai jawaban bagus' : 'Dicatat — tak akan dilatih')
    } catch {
      toast.error('Gagal menyimpan vote')
    }
  }, [])

  const setProviderAndSave = useCallback((value: string) => {
    setProvider(value)
    localStorage.setItem('ami_provider', value)
  }, [])

  const handleSend = useCallback(
    async (override?: string) => {
      const raw = override ?? input
      if (!raw.trim() || isLoading) return
      const outgoing = raw.trim()
      const historySnapshot = messages.slice(-10)
      setMessages((prev) => [...prev, { role: 'user', content: outgoing }])
      setInput('')
      setIsLoading(true)
      setStatusMessage('Menyiapkan jawaban...')
      setToolTrace([])
      stickToBottomRef.current = true

      const controller = new AbortController()
      abortRef.current = controller
      let streamedContent = ''
      let hasTokens = false
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      const onEvent = (event: ChatStreamEvent) => {
        if (event.type === 'meta' && event.session_id) {
          setActiveSessionId((cur) => cur ?? event.session_id)
        }
        if (event.type === 'status') {
          setStatusMessage(event.message)
          const m = /mengambil data \(([^)]+)\)/i.exec(event.message)
          if (m) setToolTrace((prev) => (prev.includes(m[1]) ? prev : [...prev, m[1]]))
        }
        if (event.type === 'token') {
          if (!hasTokens) {
            hasTokens = true
            setStatusMessage(null)
          }
          streamedContent += event.content
          setMessages((prev) => {
            const next = [...prev]
            const last = next.length - 1
            if (last >= 0 && next[last].role === 'assistant') next[last] = { ...next[last], content: streamedContent }
            return next
          })
        }
        if (event.type === 'done') {
          setStatusMessage(null)
          if (event.session_id) setActiveSessionId((cur) => cur ?? event.session_id)
          if (event.model) {
            setCurrentModel(event.model)
            localStorage.setItem('ami_last_model', event.model)
          }
          setMessages((prev) => {
            const next = [...prev]
            const last = next.length - 1
            if (last >= 0 && next[last].role === 'assistant') {
              next[last] = {
                ...next[last],
                content: event.reply || streamedContent,
                id: event.message_id ?? next[last].id,
                tool_calls: undefined,
                tokens_used: event.usage?.total_tokens,
                prompt_tokens: event.prompt_tokens ?? null,
                completion_tokens: event.completion_tokens ?? null,
                cost_idr: event.cost_idr ?? null,
              }
            }
            return next
          })
          fetchSessions()
        }
      }

      try {
        const result = await streamChat(
          { message: outgoing, session_id: activeSessionId, history: historySnapshot, provider },
          onEvent,
          controller.signal,
        )
        if (!result.completed || !result.reply.trim()) {
          const fallback = await api.post<ChatResponse>('/chat', {
            message: outgoing,
            session_id: activeSessionId,
            history: historySnapshot,
            provider,
          })
          if (!fallback.success || !fallback.reply?.trim()) throw new Error(fallback.message || 'Chat gagal.')
          setMessages((prev) => {
            const next = [...prev]
            const last = next.length - 1
            if (last >= 0 && next[last].role === 'assistant') {
              next[last] = { ...next[last], content: fallback.reply, tool_calls: fallback.tool_calls }
            }
            return next
          })
          if (fallback.session_id) setActiveSessionId((cur) => cur ?? fallback.session_id)
          fetchSessions()
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setMessages((prev) => {
            const next = [...prev]
            const last = next.length - 1
            if (last >= 0 && next[last].role === 'assistant' && !next[last].content) next.pop()
            return next
          })
          toast.info('Generasi jawaban dihentikan')
          return
        }
        setMessages((prev) => {
          const next = [...prev]
          const last = next.length - 1
          if (last >= 0 && next[last].role === 'assistant' && !next[last].content) next.pop()
          return next
        })
        toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan.')
      } finally {
        setStatusMessage(null)
        setIsLoading(false)
        if (abortRef.current === controller) abortRef.current = null
      }
    },
    [input, isLoading, messages, activeSessionId, provider, fetchSessions],
  )

  const regenerateLast = useCallback(() => {
    if (isLoading) return
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUser?.content.trim()) {
      toast.info('Belum ada pesan untuk diulang')
      return
    }
    setMessages((prev) => {
      const next = [...prev]
      const idx = next.map((m) => m.role).lastIndexOf('user')
      return idx >= 0 ? next.slice(0, idx) : next
    })
    handleSend(lastUser.content)
  }, [isLoading, messages, handleSend])

  return {
    messages,
    input,
    setInput,
    isLoading,
    sessions,
    activeSessionId,
    loadingSessions,
    statusMessage,
    toolTrace,
    provider,
    setProvider: setProviderAndSave,
    currentModel,
    userName,
    scrollRef,
    handleScroll,
    handleSend,
    stopStreaming: () => abortRef.current?.abort(),
    loadSession,
    createNewSession,
    deleteSession,
    voteMessage,
    regenerateLast,
  }
}

export type AmiChat = ReturnType<typeof useAmiChat>
