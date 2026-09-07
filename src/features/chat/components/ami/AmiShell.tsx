import { Suspense, lazy, useState } from 'react'
import { useAmiChat } from '../../hooks/useAmiChat'
import AmiSidebar from './AmiSidebar'
import AmiHeader from './AmiHeader'
import AmiFeed from './AmiFeed'
import AmiComposer from './AmiComposer'
import { setToken } from '@/lib/api-client'
import { bunSignInUrl } from '@/lib/sso'

const ChatFotoUploadDialog = lazy(() => import('../ChatFotoUpload'))

export default function AmiShell() {
  const chat = useAmiChat()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [fotoUploadOpen, setFotoUploadOpen] = useState(false)

  const sessions = chat.sessions

  const logout = () => {
    setToken(null)
    localStorage.removeItem('ami_provider')
    window.location.replace(bunSignInUrl())
  }

  const selectSession = (id: number) => {
    chat.loadSession(id)
    setSidebarOpen(false)
  }

  const newChat = () => {
    chat.createNewSession()
    setSidebarOpen(false)
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
        onRename={chat.renameSession}
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
        <AmiComposer chat={chat} onFoto={() => setFotoUploadOpen(true)} />
      </main>
      {fotoUploadOpen && (
        <Suspense fallback={null}>
          <ChatFotoUploadDialog open={fotoUploadOpen} onClose={() => setFotoUploadOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}
