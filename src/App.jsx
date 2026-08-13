import { useEffect, useState } from 'react'
import { useAuth } from './auth.jsx'
import {
  useStore,
  loadFromServer,
  startRealtime,
  stopRealtime,
  setSessionUser,
  resetData,
} from './store.js'
import Dashboard from './views/Dashboard.jsx'
import Books from './views/Books.jsx'
import Meetings from './views/Meetings.jsx'
import Auth from './views/Auth.jsx'

const TABS = [
  { key: 'home', label: '홈', ico: '🏠' },
  { key: 'books', label: '내 서재', ico: '📚' },
  { key: 'meetings', label: '모임', ico: '📅' },
]

export default function App() {
  const { user, loading, configured, signOut } = useAuth()
  const [tab, setTab] = useState('home')
  const [pendingBook, setPendingBook] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [data, update] = useStore()

  // 로그인 상태에 따라 서버 동기화 시작/정리
  useEffect(() => {
    if (user) {
      setSessionUser(user.id)
      loadFromServer()
      startRealtime()
    } else {
      stopRealtime()
      setSessionUser(null)
      resetData()
    }
    return () => stopRealtime()
  }, [user])

  const openBook = (id) => {
    setPendingBook(id)
    setTab('books')
  }

  if (loading) {
    return (
      <div className="splash">
        <div className="auth-logo">📖</div>
      </div>
    )
  }

  // 미로그인(또는 설정 없음) → 로그인 화면
  if (!configured || !user) {
    return <Auth />
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">📖</span>
        <div style={{ flex: 1 }}>
          <h1>온북</h1>
          <div className="sub">함께 읽고, 함께 기록해요</div>
        </div>
        <div className="account">
          <button
            className="btn sm ghost"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="계정"
          >
            👤
          </button>
          {menuOpen && (
            <div className="menu card" onMouseLeave={() => setMenuOpen(false)}>
              <div className="menu-email">{user.email}</div>
              <button
                className="btn danger sm block"
                onClick={async () => {
                  setMenuOpen(false)
                  await signOut()
                }}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </header>

      {tab === 'home' && (
        <Dashboard data={data} update={update} onOpenBook={openBook} />
      )}
      {tab === 'books' && (
        <Books
          data={data}
          update={update}
          openId={pendingBook}
          onConsumeOpen={() => setPendingBook(null)}
        />
      )}
      {tab === 'meetings' && (
        <Meetings data={data} update={update} onOpenBook={openBook} />
      )}

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'active' : ''}
            onClick={() => setTab(t.key)}
          >
            <span className="ico">{t.ico}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
