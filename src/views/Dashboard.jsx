import { useMemo, useState } from 'react'
import { updateGoal } from '../store.js'
import { fmtDate } from '../util.js'
import Stars from '../components/Stars.jsx'

export default function Dashboard({ data, update, onOpenBook }) {
  const year = data.goal.year || new Date().getFullYear()
  const [editGoal, setEditGoal] = useState(false)

  const stats = useMemo(() => computeStats(data, year), [data, year])

  const goalPct =
    data.goal.target > 0
      ? Math.min(100, Math.round((stats.doneThisYear / data.goal.target) * 100))
      : 0

  const maxMonth = Math.max(1, ...stats.byMonth)

  return (
    <div>
      {/* 요약 통계 */}
      <div className="stat-grid" style={{ marginTop: 8 }}>
        <div className="card stat">
          <div className="num">{stats.totalDone}</div>
          <div className="lab">총 완독</div>
        </div>
        <div className="card stat">
          <div className="num">{stats.reading}</div>
          <div className="lab">읽는 중</div>
        </div>
        <div className="card stat">
          <div className="num">
            {stats.avgRating ? stats.avgRating.toFixed(1) : '–'}
          </div>
          <div className="lab">평균 별점</div>
        </div>
      </div>

      {/* 연간 목표 */}
      <div className="section-title">
        {year}년 목표
        <button className="btn ghost sm" onClick={() => setEditGoal((s) => !s)}>
          {editGoal ? '닫기' : '목표 수정'}
        </button>
      </div>
      <div className="card goal-card">
        {editGoal ? (
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>연도</label>
              <input
                type="number"
                value={year}
                onChange={(e) =>
                  updateGoal(update, { year: Number(e.target.value) || year })
                }
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>목표 권수</label>
              <input
                type="number"
                value={data.goal.target}
                onChange={(e) =>
                  updateGoal(update, { target: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        ) : (
          <div className="goal-ring">
            <div className="ring" style={{ '--p': goalPct }}>
              <div className="inner">
                <div className="pct">{goalPct}%</div>
                <div className="cap">달성</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {stats.doneThisYear} / {data.goal.target}권
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>
                {stats.doneThisYear >= data.goal.target && data.goal.target > 0
                  ? '🎉 올해 목표를 달성했어요!'
                  : `목표까지 ${Math.max(
                      0,
                      data.goal.target - stats.doneThisYear
                    )}권 남았어요.`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 월별 완독 */}
      <div className="section-title">{year}년 월별 완독</div>
      <div className="card" style={{ padding: '10px 12px 8px' }}>
        <div className="bars">
          {stats.byMonth.map((v, i) => (
            <div className="bar-col" key={i}>
              <div className="v">{v || ''}</div>
              <div
                className={'bar' + (v === 0 ? ' zero' : '')}
                style={{ height: `${(v / maxMonth) * 100}%` }}
              />
              <div className="lab">{i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 완독 */}
      <div className="section-title">
        최근 완독한 책 <span className="count">{stats.recentDone.length}</span>
      </div>
      {stats.recentDone.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: '28px 20px' }}>
            아직 완독 기록이 없어요. 책을 '다 읽음'으로 바꾸면 여기 쌓여요.
          </div>
        </div>
      ) : (
        <div className="card">
          {stats.recentDone.map((b) => (
            <div
              key={b.id}
              className="book-row"
              onClick={() => onOpenBook(b.id)}
            >
              <div className="cover">
                {b.cover && /^https?:\/\//.test(b.cover) ? (
                  <img src={b.cover} alt="" />
                ) : (
                  b.cover || '📗'
                )}
              </div>
              <div className="book-info">
                <div className="t">{b.title}</div>
                <div className="meta">
                  {b.rating > 0 && <Stars value={b.rating} readonly />}
                  {b.endDate && <span className="chip">📅 {fmtDate(b.endDate)}</span>}
                </div>
                {b.oneLiner && (
                  <div className="a" style={{ marginTop: 3 }}>
                    “{b.oneLiner}”
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function computeStats(data, year) {
  const done = data.books.filter((b) => b.status === 'done')
  const reading = data.books.filter((b) => b.status === 'reading').length

  const rated = data.books.filter((b) => b.rating > 0)
  const avgRating =
    rated.length > 0
      ? rated.reduce((s, b) => s + b.rating, 0) / rated.length
      : 0

  // 완독 연/월 기준: endDate 있으면 그걸, 없으면 생성일
  const byMonth = Array(12).fill(0)
  let doneThisYear = 0
  for (const b of done) {
    const ref = b.endDate || b.createdAt?.slice(0, 10) || ''
    if (!ref) continue
    const d = new Date(ref + (ref.length <= 10 ? 'T00:00:00' : ''))
    if (isNaN(d)) continue
    if (d.getFullYear() === year) {
      byMonth[d.getMonth()]++
      doneThisYear++
    }
  }

  const recentDone = [...done]
    .sort((a, b) =>
      (b.endDate || b.createdAt || '').localeCompare(a.endDate || a.createdAt || '')
    )
    .slice(0, 5)

  return {
    totalDone: done.length,
    reading,
    avgRating,
    byMonth,
    doneThisYear,
    recentDone,
  }
}
