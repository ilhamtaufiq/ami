import { useState } from 'react'
import { toast } from 'sonner'
import { useAmiChat } from '../../hooks/useAmiChat'
import AmiSidebar from './AmiSidebar'
import AmiHeader from './AmiHeader'
import AmiFeed from './AmiFeed'
import AmiComposer from './AmiComposer'
import { setToken } from '@/lib/api-client'

export default function AmiShell() {
  const chat = useAmiChat()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [renamed, setRenamed] = useState<Record<number, string>>({})

  const sessions = chat.sessions.map((s) => (renamed[s.id] ? { ...s, title: renamed[s.id] } : s))

  const logout = () => {
    setToken(null)
    localStorage.removeItem('ami_provider')
    window.location.reload()
  }

  const selectSession = (id: number) => {
    chat.loadSession(id)
    setSidebarOpen(false)
  }

  const newChat = () => {
    chat.createNewSession()
    setSidebarOpen(false)
  }

  const renameSession = (id: number, title: string) => {
    // ponytail: backend belum ada endpoint rename — simpan lokal dulu.
    setRenamed((prev) => ({ ...prev, [id]: title }))
    toast.success('Judul diubah (lokal)')
  }

  return (
    <div className="ami-dark flex h-dvh overflow-hidden bg-[#131314] text-[#e3e3e3]">
      <AmiSidebar
        open={sidebarOpen}
        collapsed={collapsed}
        sessions={sessions}
        activeSessionId={chat.activeSessionId}
        loadingSessions={chat.loadingSessions}
        onToggle={() => setSidebarOpen((v) => !v)}
        onCollapse={() => setCollapsed((v) => !v)}
        onNewChat={newChat}
        onSelect={selectSession}
        onDelete={chat.deleteSession}
        onRename={renameSession}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <AmiHeader
          provider={chat.provider}
          onProvider={chat.setProvider}
          userName={chat.userName}
          onMenu={() => setSidebarOpen(true)}
          onLogout={logout}
        />
        <div
          ref={chat.scrollRef}
          onScroll={chat.handleScroll}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <AmiFeed chat={{ ...chat, sessions }} />
        </div>
        <AmiComposer chat={chat} />
      </main>
    </div>
  )
}
