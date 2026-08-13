import { useMemo } from 'react'
import { fmtDate, dday, progressPct, todayISO } from '../util.js'

// ─────────────────────────────────────────────────────────────
// 고령층 친화적 키오스크 대시보드
//
// 설계 원칙
//  - 큰 글씨 / 큰 버튼 / 고대비: 멀리서도 잘 보이고 손으로 누르기 쉽게
//  - 한 화면에 핵심만: 오늘 읽을 책, 다음 모임, 큰 메뉴 4개
//  - 아이콘과 글자를 항상 함께: 아이콘만으로 헷갈리지 않게
// ─────────────────────────────────────────────────────────────

const HOUR_GREETING = () => {
  const h = new Date().getHours()
  if (h < 6) return '늦은 밤이에요'
  if (h < 11) return '좋은 아침이에요'
  if (h < 14) return '점심 잘 드셨어요'
  if (h < 18) return '좋은 오후예요'
  return '편안한 저녁이에요'
}

export default function Kiosk({ data, onNavigate, onOpenBook }) {
  const year = data.goal.year || new Date().getFullYear()

  const info = useMemo(() => computeKiosk(data, year), [data, year])

  return (
    <div className="kiosk-home">
      {/* 인사 + 날짜 */}
      <div className="k-hello card">
        <div className="k-hello-main">
          <div className="k-greet">{HOUR_GREETING()} 👋</div>
          <div className="k-today">{fmtToday()}</div>
        </div>
        <div className="k-goal">
          <div className="k-goal-pct">{info.goalPct}%</div>
          <div className="k-goal-cap">
            올해 목표<br />달성
          </div>
        </div>
      </div>

      {/* 큰 숫자 요약 */}
      <div className="k-stats">
        <div className="k-stat card">
          <div className="k-stat-ico">✅</div>
          <div className="k-stat-num">{info.totalDone}</div>
          <div className="k-stat-lab">다 읽은 책</div>
        </div>
        <div className="k-stat card">
          <div className="k-stat-ico">📖</div>
          <div className="k-stat-num">{info.readingCount}</div>
          <div className="k-stat-lab">읽는 중</div>
        </div>
        <div className="k-stat card">
          <div className="k-stat-ico">📅</div>
          <div className="k-stat-num">{info.upcomingCount}</div>
          <div className="k-stat-lab">다가올 모임</div>
        </div>
      </div>

      {/* 지금 읽는 책 */}
      <div className="k-section-title">📖 지금 읽는 책</div>
      {info.reading ? (
        <button
          className="k-book card"
          onClick={() => onOpenBook(info.reading.id)}
        >
          <div className="k-book-cover">
            {info.reading.cover && /^https?:\/\//.test(info.reading.cover) ? (
              <img src={info.reading.cover} alt="" />
            ) : (
              info.reading.cover || '📗'
            )}
          </div>
          <div className="k-book-body">
            <div className="k-book-title">{info.reading.title || '제목 없음'}</div>
            {info.reading.author && (
              <div className="k-book-author">{info.reading.author}</div>
            )}
            <div className="k-progress">
              <span style={{ width: `${info.readingPct}%` }} />
            </div>
            <div className="k-progress-lab">
              {info.reading.totalPages > 0
                ? `${info.reading.currentPage} / ${info.reading.totalPages}쪽 · ${info.readingPct}%`
                : `${info.readingPct}% 읽었어요`}
            </div>
          </div>
          <div className="k-book-go" aria-hidden="true">›</div>
        </button>
      ) : (
        <div className="k-empty card">
          아직 읽는 중인 책이 없어요.<br />
          <b>내 서재</b>에서 책을 골라 보세요.
        </div>
      )}

      {/* 다음 모임 */}
      <div className="k-section-title">📅 다음 모임</div>
      {info.nextMeeting ? (
        <button
          className="k-meeting card"
          onClick={() => onNavigate('meetings')}
        >
          <div className="k-dday">{dday(info.nextMeeting.date)}</div>
          <div className="k-meeting-body">
            <div className="k-meeting-title">
              {info.nextMeeting.title || '독서모임'}
            </div>
            <div className="k-meeting-meta">
              🗓 {fmtDate(info.nextMeeting.date)}
              {info.nextMeeting.place && <>　📍 {info.nextMeeting.place}</>}
            </div>
            {info.nextBook && (
              <div className="k-meeting-book">📚 {info.nextBook.title}</div>
            )}
          </div>
          <div className="k-book-go" aria-hidden="true">›</div>
        </button>
      ) : (
        <div className="k-empty card">
          예정된 모임이 없어요.<br />
          <b>모임 일정</b>에서 새 모임을 잡아 보세요.
        </div>
      )}

      {/* 큰 메뉴 */}
      <div className="k-section-title">무엇을 할까요?</div>
      <div className="k-menu">
        <button className="k-menu-btn card" onClick={() => onNavigate('books')}>
          <span className="k-menu-ico">📚</span>
          <span className="k-menu-lab">내 서재</span>
          <span className="k-menu-sub">책 보기 · 기록하기</span>
        </button>
        <button
          className="k-menu-btn card"
          onClick={() => onNavigate('meetings')}
        >
          <span className="k-menu-ico">📅</span>
          <span className="k-menu-lab">모임 일정</span>
          <span className="k-menu-sub">모임 보기 · 잡기</span>
        </button>
      </div>
    </div>
  )
}

function fmtToday() {
  const d = new Date()
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`
}

function computeKiosk(data, year) {
  const done = data.books.filter((b) => b.status === 'done')
  const readingList = data.books.filter((b) => b.status === 'reading')

  // 가장 최근에 손댄 '읽는 중' 책을 대표로
  const reading = [...readingList].sort((a, b) =>
    (b.startDate || b.createdAt || '').localeCompare(
      a.startDate || a.createdAt || ''
    )
  )[0]

  // 올해 완독 수 → 목표 달성률
  let doneThisYear = 0
  for (const b of done) {
    const ref = b.endDate || b.createdAt?.slice(0, 10) || ''
    if (!ref) continue
    const d = new Date(ref + (ref.length <= 10 ? 'T00:00:00' : ''))
    if (!isNaN(d) && d.getFullYear() === year) doneThisYear++
  }
  const goalPct =
    data.goal.target > 0
      ? Math.min(100, Math.round((doneThisYear / data.goal.target) * 100))
      : 0

  // 다가오는 모임(오늘 포함) 중 가장 가까운 것
  const today = todayISO()
  const upcoming = data.meetings
    .filter((m) => m.date && m.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const nextMeeting = upcoming[0]
  const nextBook = nextMeeting
    ? data.books.find((b) => b.id === nextMeeting.bookId)
    : null

  return {
    totalDone: done.length,
    readingCount: readingList.length,
    upcomingCount: upcoming.length,
    goalPct,
    reading,
    readingPct: reading ? progressPct(reading) : 0,
    nextMeeting,
    nextBook,
  }
}
