import { useState, useEffect } from 'react'
import { useStore } from './store.js'
import Dashboard from './views/Dashboard.jsx'
import Kiosk from './views/Kiosk.jsx'
import Books from './views/Books.jsx'
import Meetings from './views/Meetings.jsx'

const TABS = [
  { key: 'home', label: '홈', ico: '🏠' },
  { key: 'books', label: '내 서재', ico: '📚' },
  { key: 'meetings', label: '모임', ico: '📅' },
]

const KIOSK_KEY = 'moru.kiosk'

export default function App() {
  const [data, update] = useStore()
  const [tab, setTab] = useState('home')
  // 다른 탭에서 특정 책 상세를 열도록 요청하는 신호
  const [pendingBook, setPendingBook] = useState(null)
  // 고령층 친화 큰글씨 키오스크 모드 (설정을 로컬에 기억)
  const [kiosk, setKiosk] = useState(
    () => localStorage.getItem(KIOSK_KEY) === '1'
  )

  useEffect(() => {
    localStorage.setItem(KIOSK_KEY, kiosk ? '1' : '0')
    document.body.classList.toggle('kiosk-body', kiosk)
  }, [kiosk])

  const openBook = (id) => {
    setPendingBook(id)
    setTab('books')
  }

  return (
    <div className={'app' + (kiosk ? ' kiosk' : '')}>
      <header className="app-header">
        <span className="logo">📚</span>
        <div className="app-title">
          <h1>모루 독서 기록장</h1>
          <div className="sub">함께 읽고, 함께 기록해요</div>
        </div>
        <button
          className={'mode-toggle' + (kiosk ? ' on' : '')}
          onClick={() => setKiosk((v) => !v)}
          aria-pressed={kiosk}
          title={kiosk ? '일반 보기로 바꾸기' : '큰글씨 보기로 바꾸기'}
        >
          <span className="mode-ico">{kiosk ? '🔎' : '🔍'}</span>
          <span className="mode-lab">{kiosk ? '일반 보기' : '큰글씨'}</span>
        </button>
      </header>

      {tab === 'home' &&
        (kiosk ? (
          <Kiosk data={data} onNavigate={setTab} onOpenBook={openBook} />
        ) : (
          <Dashboard data={data} update={update} onOpenBook={openBook} />
        ))}
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
