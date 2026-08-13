import { useMemo, useState } from 'react'
import {
  BOOK_STATUS,
  addBook,
  removeBook,
  updateBook,
} from '../store.js'
import { fmtDate, progressPct } from '../util.js'
import Stars from '../components/Stars.jsx'
import Sheet from '../components/Sheet.jsx'

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'reading', label: '읽는 중' },
  { key: 'done', label: '다 읽음' },
  { key: 'want', label: '읽고 싶어요' },
]

export default function Books({ data, update, openId, onConsumeOpen }) {
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null) // book object or null
  const [creating, setCreating] = useState(false)

  // 다른 화면에서 특정 책 열기 요청이 오면 처리
  useMemo(() => {
    if (openId) {
      const b = data.books.find((x) => x.id === openId)
      if (b) setEditing(b)
      onConsumeOpen && onConsumeOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId])

  const list = useMemo(() => {
    const arr =
      filter === 'all'
        ? data.books
        : data.books.filter((b) => b.status === filter)
    return arr
  }, [data.books, filter])

  // 편집 대상이 최신 데이터를 반영하도록
  const editingBook = editing
    ? data.books.find((b) => b.id === editing.id) || editing
    : null

  return (
    <div>
      <div className="seg">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={filter === f.key ? 'on' : ''}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <div className="big">📚</div>
          <div>아직 등록한 책이 없어요.</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            오른쪽 아래 + 버튼으로 첫 책을 추가해 보세요.
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 4 }}>
          {list.map((b) => (
            <BookRow key={b.id} book={b} onClick={() => setEditing(b)} />
          ))}
        </div>
      )}

      <button
        className="fab"
        onClick={() => setCreating(true)}
        aria-label="책 추가"
      >
        +
      </button>

      {creating && (
        <BookEditor
          data={data}
          onClose={() => setCreating(false)}
          onSave={(vals) => {
            addBook(update, vals)
            setCreating(false)
          }}
        />
      )}

      {editingBook && (
        <BookDetail
          book={editingBook}
          data={data}
          update={update}
          onClose={() => setEditing(null)}
          onDelete={() => {
            if (confirm('이 책 기록을 삭제할까요?')) {
              removeBook(update, editingBook.id)
              setEditing(null)
            }
          }}
        />
      )}
    </div>
  )
}

function BookRow({ book, onClick }) {
  const st = BOOK_STATUS[book.status]
  const pct = progressPct(book)
  return (
    <div className="book-row" onClick={onClick}>
      <div className="cover">
        {book.cover && /^https?:\/\//.test(book.cover) ? (
          <img src={book.cover} alt="" />
        ) : (
          book.cover || '📕'
        )}
      </div>
      <div className="book-info">
        <div className="t">{book.title || '(제목 없음)'}</div>
        <div className="a">{book.author || '저자 미상'}</div>
        <div className="meta">
          <span className="chip" style={{ color: st.color }}>
            {st.emoji} {st.label}
          </span>
          {book.rating > 0 && (
            <Stars value={book.rating} readonly />
          )}
        </div>
        {book.status === 'reading' && book.totalPages > 0 && (
          <div className="progress">
            <span style={{ width: pct + '%' }} />
          </div>
        )}
      </div>
    </div>
  )
}

// 신규 등록용 간단 폼
function BookEditor({ onClose, onSave }) {
  const [v, setV] = useState({
    title: '',
    author: '',
    cover: '',
    status: 'want',
    totalPages: '',
  })
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })

  return (
    <Sheet title="책 추가" onClose={onClose}>
      <div className="field">
        <label>제목</label>
        <input value={v.title} onChange={set('title')} placeholder="책 제목" autoFocus />
      </div>
      <div className="field">
        <label>저자</label>
        <input value={v.author} onChange={set('author')} placeholder="지은이" />
      </div>
      <div className="row">
        <div className="field">
          <label>상태</label>
          <select value={v.status} onChange={set('status')}>
            {Object.entries(BOOK_STATUS).map(([k, s]) => (
              <option key={k} value={k}>
                {s.emoji} {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>전체 쪽수</label>
          <input
            type="number"
            inputMode="numeric"
            value={v.totalPages}
            onChange={set('totalPages')}
            placeholder="예: 320"
          />
        </div>
      </div>
      <div className="field">
        <label>표지 (이모지 또는 이미지 URL, 선택)</label>
        <input value={v.cover} onChange={set('cover')} placeholder="📗 또는 https://..." />
      </div>
      <button
        className="btn primary block"
        onClick={() =>
          onSave({
            ...v,
            totalPages: Number(v.totalPages) || 0,
          })
        }
        disabled={!v.title.trim()}
      >
        추가하기
      </button>
    </Sheet>
  )
}

// 책 상세 + 편집 + 별점/한줄평/토론메모
function BookDetail({ book, data, update, onClose, onDelete }) {
  const patch = (p) => updateBook(update, book.id, p)
  const meeting = data.meetings.find((m) => m.id === book.meetingId)

  return (
    <Sheet
      title="독서 기록"
      onClose={onClose}
      headExtra={
        <button className="btn danger sm" onClick={onDelete}>
          삭제
        </button>
      }
    >
      <div className="field">
        <label>제목</label>
        <input value={book.title} onChange={(e) => patch({ title: e.target.value })} />
      </div>
      <div className="field">
        <label>저자</label>
        <input value={book.author} onChange={(e) => patch({ author: e.target.value })} />
      </div>

      <div className="row">
        <div className="field">
          <label>상태</label>
          <select value={book.status} onChange={(e) => patch({ status: e.target.value })}>
            {Object.entries(BOOK_STATUS).map(([k, s]) => (
              <option key={k} value={k}>
                {s.emoji} {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>모임 연결</label>
          <select
            value={book.meetingId}
            onChange={(e) => patch({ meetingId: e.target.value })}
          >
            <option value="">연결 안 함</option>
            {data.meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title || '(제목없는 모임)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>현재 쪽</label>
          <input
            type="number"
            inputMode="numeric"
            value={book.currentPage || ''}
            onChange={(e) => patch({ currentPage: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="field">
          <label>전체 쪽수</label>
          <input
            type="number"
            inputMode="numeric"
            value={book.totalPages || ''}
            onChange={(e) => patch({ totalPages: Number(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>시작일</label>
          <input
            type="date"
            value={book.startDate}
            onChange={(e) => patch({ startDate: e.target.value })}
          />
        </div>
        <div className="field">
          <label>완독일</label>
          <input
            type="date"
            value={book.endDate}
            onChange={(e) => patch({ endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="divider" />

      <div className="field">
        <label>⭐ 별점</label>
        <Stars value={book.rating} onChange={(n) => patch({ rating: n })} />
      </div>
      <div className="field">
        <label>✍️ 한줄평</label>
        <input
          value={book.oneLiner}
          onChange={(e) => patch({ oneLiner: e.target.value })}
          placeholder="이 책을 한 문장으로 남긴다면?"
        />
      </div>
      <div className="field">
        <label>📝 감상·메모</label>
        <textarea
          value={book.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="기억에 남는 구절, 느낀 점 등"
        />
      </div>
      <div className="field">
        <label>💬 토론 질문·발제 메모</label>
        <textarea
          value={book.discussion}
          onChange={(e) => patch({ discussion: e.target.value })}
          placeholder="모임에서 나누고 싶은 질문이나 발제 내용"
        />
      </div>

      {meeting && (
        <div className="link-book">
          <span>📅</span>
          <div style={{ fontSize: 13 }}>
            <b>{meeting.title}</b>
            {meeting.date ? ` · ${fmtDate(meeting.date)}` : ''}
          </div>
        </div>
      )}

      <div style={{ height: 8 }} />
      <button className="btn block" onClick={onClose}>
        완료
      </button>
    </Sheet>
  )
}
