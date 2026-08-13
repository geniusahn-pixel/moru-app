import { useMemo, useState } from 'react'
import {
  addMeeting,
  removeMeeting,
  updateMeeting,
  BOOK_STATUS,
} from '../store.js'
import { fmtDate, dday, todayISO } from '../util.js'
import Sheet from '../components/Sheet.jsx'

export default function Meetings({ data, update, onOpenBook }) {
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  // 날짜순 정렬, 다가오는 모임 먼저
  const { upcoming, past } = useMemo(() => {
    const today = todayISO()
    const sorted = [...data.meetings].sort((a, b) =>
      (a.date || '9999').localeCompare(b.date || '9999')
    )
    return {
      upcoming: sorted.filter((m) => !m.date || m.date >= today),
      past: sorted
        .filter((m) => m.date && m.date < today)
        .reverse(),
    }
  }, [data.meetings])

  const editingMeeting = editing
    ? data.meetings.find((m) => m.id === editing.id) || editing
    : null

  return (
    <div>
      {data.meetings.length === 0 ? (
        <div className="empty">
          <div className="big">📅</div>
          <div>등록된 모임이 없어요.</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            + 버튼으로 다음 독서모임 일정을 만들어 보세요.
          </div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <div className="section-title">
                다가오는 모임 <span className="count">{upcoming.length}</span>
              </div>
              <div className="card">
                {upcoming.map((m) => (
                  <MeetingRow
                    key={m.id}
                    meeting={m}
                    data={data}
                    onClick={() => setEditing(m)}
                  />
                ))}
              </div>
            </>
          )}
          {past.length > 0 && (
            <>
              <div className="section-title">
                지난 모임 <span className="count">{past.length}</span>
              </div>
              <div className="card">
                {past.map((m) => (
                  <MeetingRow
                    key={m.id}
                    meeting={m}
                    data={data}
                    onClick={() => setEditing(m)}
                    past
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <button className="fab" onClick={() => setCreating(true)} aria-label="모임 추가">
        +
      </button>

      {creating && (
        <MeetingEditor
          data={data}
          onClose={() => setCreating(false)}
          onSave={(vals) => {
            addMeeting(update, vals)
            setCreating(false)
          }}
        />
      )}

      {editingMeeting && (
        <MeetingEditor
          data={data}
          meeting={editingMeeting}
          onOpenBook={onOpenBook}
          onClose={() => setEditing(null)}
          onSave={(vals) => {
            updateMeeting(update, editingMeeting.id, vals)
            setEditing(null)
          }}
          onDelete={() => {
            if (confirm('이 모임을 삭제할까요?')) {
              removeMeeting(update, editingMeeting.id)
              setEditing(null)
            }
          }}
        />
      )}
    </div>
  )
}

function MeetingRow({ meeting, data, onClick, past }) {
  const book = data.books.find((b) => b.id === meeting.bookId)
  return (
    <div className="book-row" onClick={onClick}>
      <div
        className="cover"
        style={{ background: past ? 'var(--surface-2)' : 'var(--primary-dim)' }}
      >
        {book && book.cover && /^https?:\/\//.test(book.cover) ? (
          <img src={book.cover} alt="" />
        ) : book && book.cover ? (
          book.cover
        ) : (
          '📖'
        )}
      </div>
      <div className="book-info">
        <div className="t">{meeting.title || '(제목없는 모임)'}</div>
        <div className="a">
          {book ? `📕 ${book.title}` : '이번 모임 책 미정'}
        </div>
        <div className="meta">
          {meeting.date && <span className="chip">📅 {fmtDate(meeting.date)}</span>}
          {meeting.date && !past && (
            <span className="chip" style={{ color: 'var(--primary)' }}>
              {dday(meeting.date)}
            </span>
          )}
          {meeting.place && <span className="chip">📍 {meeting.place}</span>}
        </div>
      </div>
    </div>
  )
}

function MeetingEditor({ meeting, data, onClose, onSave, onDelete, onOpenBook }) {
  const [v, setV] = useState({
    title: meeting?.title || '',
    date: meeting?.date || '',
    place: meeting?.place || '',
    bookId: meeting?.bookId || '',
    memo: meeting?.memo || '',
  })
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  const linkedBook = data.books.find((b) => b.id === v.bookId)

  return (
    <Sheet
      title={meeting ? '모임 수정' : '모임 추가'}
      onClose={onClose}
      headExtra={
        meeting && (
          <button className="btn danger sm" onClick={onDelete}>
            삭제
          </button>
        )
      }
    >
      <div className="field">
        <label>모임 이름 / 회차</label>
        <input
          value={v.title}
          onChange={set('title')}
          placeholder="예: 8월 정기모임 · 3회차"
          autoFocus
        />
      </div>
      <div className="row">
        <div className="field">
          <label>날짜</label>
          <input type="date" value={v.date} onChange={set('date')} />
        </div>
        <div className="field">
          <label>장소</label>
          <input value={v.place} onChange={set('place')} placeholder="예: 합정 카페" />
        </div>
      </div>
      <div className="field">
        <label>이번 모임 책</label>
        <select value={v.bookId} onChange={set('bookId')}>
          <option value="">선택 안 함</option>
          {data.books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title || '(제목 없음)'}
              {b.author ? ` · ${b.author}` : ''}
            </option>
          ))}
        </select>
      </div>

      {linkedBook && (
        <div
          className="link-book"
          style={{ cursor: onOpenBook ? 'pointer' : 'default' }}
          onClick={() => onOpenBook && onOpenBook(linkedBook.id)}
        >
          <div className="cover" style={{ width: 34, height: 46, fontSize: 20 }}>
            {linkedBook.cover && /^https?:\/\//.test(linkedBook.cover) ? (
              <img src={linkedBook.cover} alt="" />
            ) : (
              linkedBook.cover || '📕'
            )}
          </div>
          <div style={{ fontSize: 13, flex: 1 }}>
            <b>{linkedBook.title}</b>
            <div style={{ color: 'var(--text-dim)' }}>
              {BOOK_STATUS[linkedBook.status].emoji}{' '}
              {BOOK_STATUS[linkedBook.status].label}
            </div>
          </div>
          {onOpenBook && <span style={{ color: 'var(--text-faint)' }}>기록 보기 ›</span>}
        </div>
      )}

      <div className="field" style={{ marginTop: 14 }}>
        <label>모임 메모 (공지·발제·후기)</label>
        <textarea
          value={v.memo}
          onChange={set('memo')}
          placeholder="모임 공지, 나눌 질문, 후기 등을 적어두세요."
        />
      </div>

      <button
        className="btn primary block"
        onClick={() => onSave(v)}
        disabled={!v.title.trim() && !v.date}
      >
        저장
      </button>
    </Sheet>
  )
}
