import { useRef } from 'react'
import { ArrowUp, Mic, Plus, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AmiChat } from '../../hooks/useAmiChat'

export default function AmiComposer({ chat }: { chat: AmiChat }) {
  const { input, setInput, isLoading, handleSend, stopStreaming } = chat
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
          className="flex items-end gap-1.5 rounded-[28px] bg-[#1e1f20] px-2.5 py-2.5 transition-shadow focus-within:shadow-[0_0_0_1px_#444746]"
        >
          <button
            type="button"
            title="Upload file / tools"
            className="rounded-full p-2.5 text-[#c4c7c5] transition-colors hover:bg-[#2f3033]"
          >
            <Plus className="h-5 w-5" />
          </button>
          <textarea
            ref={taRef}
            rows={1}
            value={input}
            disabled={isLoading}
            onChange={(e) => {
              setInput(e.target.value)
              autosize()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
                requestAnimationFrame(autosize)
              }
            }}
            placeholder="Tanyakan Ami"
            className="max-h-[200px] flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-relaxed text-[#e3e3e3] outline-none placeholder:text-[#9aa0a6] disabled:opacity-50"
          />
          <button
            type="button"
            title="Input suara"
            className="rounded-full p-2.5 text-[#c4c7c5] transition-colors hover:bg-[#2f3033]"
          >
            <Mic className="h-5 w-5" />
          </button>
          {isLoading ? (
            <button
              type="button"
              title="Hentikan"
              onClick={stopStreaming}
              className="rounded-full bg-[#e3e3e3] p-2.5 text-[#131314] transition-transform hover:scale-105"
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
                  ? 'bg-[#e3e3e3] text-[#131314] hover:scale-105'
                  : 'cursor-default bg-[#2f3033] text-[#5f6368]',
              )}
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}
        </form>
        <p className="px-2 pb-1 pt-2 text-center text-[11px] text-[#9aa0a6]">
          Ami dapat menampilkan info yang tidak akurat, jadi periksa kembali jawabannya.
        </p>
      </div>
    </div>
  )
}
