import { useRef } from 'react'
import { ArrowUp, Camera, Mic, Plus, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AmiChat } from '../../hooks/useAmiChat'

export default function AmiComposer({ chat, onFoto }: { chat: AmiChat; onFoto: () => void }) {
  const {
    input,
    setInput,
    isLoading,
    handleSend,
    stopStreaming,
    suggest,
    suggestOpen,
    suggestIndex,
    setSuggestIndex,
    fetchSuggest,
    applySuggestion,
    closeSuggest,
  } = chat
  const taRef = useRef<HTMLTextAreaElement>(null)

  const autosize = () => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  const canSend = input.trim().length > 0 && !isLoading

  return (
    <div className="shrink-0 px-4 pb-2 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
            requestAnimationFrame(autosize)
          }}
          className="flex items-end gap-1.5 rounded-[28px] bg-[var(--ami-surface)] px-2.5 py-2.5 transition-shadow focus-within:shadow-[0_0_0_1px_#444746]"
        >
          <button
            type="button"
            title="Upload file / tools"
            className="rounded-full p-2.5 text-[var(--ami-text2)] transition-colors hover:bg-[var(--ami-bubble)]"
          >
            <Plus className="h-5 w-5" />
          </button>
          <div className="relative flex-1">
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              disabled={isLoading}
              onChange={(e) => {
                setInput(e.target.value)
                autosize()
                fetchSuggest(e.target.value)
              }}
              onKeyDown={(e) => {
                if (suggestOpen && suggest.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setSuggestIndex((suggestIndex + 1) % suggest.length)
                    return
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setSuggestIndex((suggestIndex - 1 + suggest.length) % suggest.length)
                    return
                  }
                  if (e.key === 'Tab' || e.key === 'Enter') {
                    e.preventDefault()
                    applySuggestion(suggest[suggestIndex].label)
                    return
                  }
                  if (e.key === 'Escape') {
                    closeSuggest()
                    return
                  }
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  closeSuggest()
                  handleSend()
                  requestAnimationFrame(autosize)
                }
              }}
              onBlur={() => setTimeout(closeSuggest, 150)}
              placeholder="Tanyakan Ami"
              className="max-h-[200px] w-full flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-relaxed text-[var(--ami-text)] outline-none placeholder:text-[var(--ami-muted)] disabled:opacity-50"
            />
            {suggestOpen && suggest.length > 0 && (
              <ul className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl bg-[var(--ami-bubble)] py-1 shadow-xl">
                {suggest.map((p, idx) => (
                  <li key={p.id ?? `${p.kind}-${idx}`}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        applySuggestion(p.label)
                      }}
                      onMouseEnter={() => setSuggestIndex(idx)}
                      className={`flex w-full items-center gap-2 truncate px-4 py-2.5 text-left text-sm ${idx === suggestIndex ? 'bg-[var(--ami-hover)]' : ''}`}
                    >
                      <span className="shrink-0 rounded-full bg-[var(--ami-link)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--ami-link)]">
                        {p.kind}
                      </span>
                      <span className="truncate text-[var(--ami-text)]">{p.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            title="Kirim foto ke paket"
            onClick={onFoto}
            className="rounded-full p-2.5 text-[var(--ami-text2)] transition-colors hover:bg-[var(--ami-bubble)]"
          >
            <Camera className="h-5 w-5" />
          </button>
          <button
            type="button"
            title="Input suara"
            className="rounded-full p-2.5 text-[var(--ami-text2)] transition-colors hover:bg-[var(--ami-bubble)]"
          >
            <Mic className="h-5 w-5" />
          </button>
          {isLoading ? (
            <button
              type="button"
              title="Hentikan"
              onClick={stopStreaming}
              className="rounded-full bg-[var(--ami-text)] p-2.5 text-[var(--ami-bg)] transition-transform hover:scale-105"
            >
              <Square className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="submit"
              title="Kirim"
              disabled={!canSend}
              className={cn(
                'rounded-full p-2.5 transition-all',
                canSend
                  ? 'bg-[var(--ami-text)] text-[var(--ami-bg)] hover:scale-105'
                  : 'cursor-default bg-[var(--ami-bubble)] text-[var(--ami-disabled)]',
              )}
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}
        </form>
        <p className="px-2 pb-1 pt-2 text-center text-[11px] text-[var(--ami-muted)]">
          Ami dapat menampilkan info yang tidak akurat, jadi periksa kembali jawabannya.
        </p>
      </div>
    </div>
  )
}
