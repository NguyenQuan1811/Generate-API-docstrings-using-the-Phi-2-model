import { useEffect, useState } from 'react'

import { useAuth } from './hooks/useAuth'
import { useHistory } from './hooks/useHistory'

import AuthPage from './pages/AuthPage'
import ChatPage from './pages/ChatPage'
import AdminPage from './pages/AdminPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  const { user, login, logout } = useAuth()
  const { history, refresh } = useHistory()

  const [page, setPage] = useState('chat')

  // THÊM ĐOẠN NÀY: Tự động đăng xuất khi đóng tab/trình duyệt
  useEffect(() => {
    const handleTabClose = () => {
      logout() // Gọi hàm logout để xóa session/localStorage
    }

    window.addEventListener('beforeunload', handleTabClose)

    return () => {
      window.removeEventListener('beforeunload', handleTabClose)
    }
  }, [logout])

  useEffect(() => {
    if (user) refresh()
  }, [user])

  // ===== LOGIN =====
  if (!user) {
    return <AuthPage onLogin={login} />
  }

  // ===== ADMIN PAGE =====
  if (page === 'admin') {
    return (
      <AdminPage
        onLogout={logout}
        onBack={() => setPage('chat')}
        onOpenDashboard={() => setPage('dashboard')}
      />
    )
  }

  // ===== DASHBOARD PAGE (LINE + PIE CHART) =====
  if (page === 'dashboard') {
    return (
      <DashboardPage
        onBack={() => setPage('admin')}
      />
    )
  }

  // ===== CHAT PAGE =====
  return (
    <ChatPage
      user={user}
      onLogout={logout}
      history={history}
      onHistoryUpdate={refresh}
      onOpenAdmin={() => setPage('admin')}
    />
  )
}