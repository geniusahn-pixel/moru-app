import { useState } from 'react'
import { useStore } from './store.js'
import Dashboard from './views/Dashboard.jsx'
import Books from './views/Books.jsx'
import Meetings from './views/Meetings.jsx'

const TABS = [
  { key: 'home', label: '홈', ico: '🏠' },
  { key: 'books', label: '내 서재', ico: '📚' },
  { key: 'meetings', label: '모임', ico: '📅' },
]

export default function App() {
  const [data, update] = useStore()
  const [tab, setTab] = useState('home')
  // 다른 탭에서 특정 책 상세를 열도록 요청하는 신호
  const [pendingBook, setPendingBook] = useState(null)

  const openBook = (id) => {
    setPendingBook(id)
    setTab('books')
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">📚</span>
        <div>
          <h1>모루 독서 기록장</h1>
          <div className="sub">함께 읽고, 함께 기록해요</div>
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
