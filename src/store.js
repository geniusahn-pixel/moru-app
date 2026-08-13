// ─────────────────────────────────────────────────────────────
// 데이터 계층: localStorage 기반 저장소
//
// 지금은 브라우저 로컬에만 저장합니다. 나중에 서버/로그인이 필요해지면
// 이 파일의 load/save 함수만 API 호출로 바꾸면 화면 코드는 그대로 씁니다.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'moru.data.v1'

// 책 상태
export const BOOK_STATUS = {
  want: { label: '읽고 싶어요', emoji: '🔖', color: '#8b8b9e' },
  reading: { label: '읽는 중', emoji: '📖', color: '#7c5cff' },
  done: { label: '다 읽음', emoji: '✅', color: '#22b07d' },
}

// 앱 전역 기본값
function defaultData() {
  return {
    books: [],
    meetings: [],
    goal: { year: new Date().getFullYear(), target: 12 }, // 연간 목표 권수
  }
}

// ── 저수준 입출력 ────────────────────────────────────────────
function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.warn('저장 데이터 읽기 실패, 초기화합니다.', e)
    return null
  }
}

function writeRaw(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('저장 실패', e)
  }
}

// 저장된 데이터를 최신 스키마 기본값과 병합해 누락 필드를 채움
function normalize(data) {
  const base = defaultData()
  if (!data || typeof data !== 'object') return base
  return {
    books: Array.isArray(data.books) ? data.books : base.books,
    meetings: Array.isArray(data.meetings) ? data.meetings : base.meetings,
    goal: { ...base.goal, ...(data.goal || {}) },
  }
}

export function loadData() {
  return normalize(readRaw())
}

export function saveData(data) {
  writeRaw(data)
}

// ── ID 생성 ─────────────────────────────────────────────────
export function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  )
}

// ── React 훅: 어디서나 같은 데이터를 공유 ─────────────────────
// 간단한 pub/sub로 여러 컴포넌트가 동일한 상태를 보게 함.
const listeners = new Set()
let current = loadData()

function emit() {
  saveData(current)
  listeners.forEach((fn) => fn(current))
}

export function useStore() {
  const [data, setData] = useState(current)

  useEffect(() => {
    const fn = (d) => setData(d)
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])

  const update = useCallback((mutator) => {
    const next = mutator({ ...current })
    current = next
    emit()
  }, [])

  return [data, update]
}

// ── 책 액션 ─────────────────────────────────────────────────
export function addBook(update, book) {
  const now = new Date().toISOString()
  const newBook = {
    id: uid(),
    title: '',
    author: '',
    cover: '', // 이모지 또는 이미지 URL
    status: 'want',
    totalPages: 0,
    currentPage: 0,
    startDate: '',
    endDate: '',
    rating: 0, // 0~5
    oneLiner: '', // 한줄평
    notes: '', // 감상/메모
    discussion: '', // 토론 질문·발제 메모
    meetingId: '', // 어떤 모임에서 다룬 책인지
    createdAt: now,
    ...book,
  }
  update((d) => ({ ...d, books: [newBook, ...d.books] }))
  return newBook
}

export function updateBook(update, id, patch) {
  update((d) => ({
    ...d,
    books: d.books.map((b) => (b.id === id ? { ...b, ...patch } : b)),
  }))
}

export function removeBook(update, id) {
  update((d) => ({
    ...d,
    books: d.books.filter((b) => b.id !== id),
    // 이 책을 지정한 모임에서 참조 해제
    meetings: d.meetings.map((m) =>
      m.bookId === id ? { ...m, bookId: '' } : m
    ),
  }))
}

// ── 모임 액션 ───────────────────────────────────────────────
export function addMeeting(update, meeting) {
  const newMeeting = {
    id: uid(),
    title: '',
    date: '',
    place: '',
    bookId: '',
    memo: '',
    createdAt: new Date().toISOString(),
    ...meeting,
  }
  update((d) => ({ ...d, meetings: [...d.meetings, newMeeting] }))
  return newMeeting
}

export function updateMeeting(update, id, patch) {
  update((d) => ({
    ...d,
    meetings: d.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  }))
}

export function removeMeeting(update, id) {
  update((d) => ({
    ...d,
    meetings: d.meetings.filter((m) => m.id !== id),
    books: d.books.map((b) =>
      b.meetingId === id ? { ...b, meetingId: '' } : b
    ),
  }))
}

// ── 목표 액션 ───────────────────────────────────────────────
export function updateGoal(update, patch) {
  update((d) => ({ ...d, goal: { ...d.goal, ...patch } }))
}
