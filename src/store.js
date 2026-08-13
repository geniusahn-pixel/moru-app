// ─────────────────────────────────────────────────────────────
// 데이터 계층
//
// 로그인하면 Supabase(공용 데이터베이스)가 원본이 됩니다. 모든 변경은
// 화면에 즉시 반영(낙관적 업데이트)하고 동시에 서버에 기록하며, 다른
// 사람이 바꾼 내용은 실시간 구독으로 받아옵니다. 오프라인/로그인 전에는
// localStorage 캐시를 사용합니다.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

// 책 상태
export const BOOK_STATUS = {
  want: { label: '읽고 싶어요', emoji: '🔖', color: '#8b8b9e' },
  reading: { label: '읽는 중', emoji: '📖', color: '#7c5cff' },
  done: { label: '다 읽음', emoji: '✅', color: '#22b07d' },
}

function defaultGoal() {
  return { year: new Date().getFullYear(), target: 12 }
}
function emptyData() {
  return { books: [], meetings: [], goal: defaultGoal() }
}

// ── 로컬 캐시 (오프라인/로그인 전) ───────────────────────────
const CACHE_KEY = 'onbook.cache.v1'
function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return emptyData()
    const d = JSON.parse(raw)
    return {
      books: Array.isArray(d.books) ? d.books : [],
      meetings: Array.isArray(d.meetings) ? d.meetings : [],
      goal: { ...defaultGoal(), ...(d.goal || {}) },
    }
  } catch {
    return emptyData()
  }
}
function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

// ── 전역 상태 + pub/sub ──────────────────────────────────────
let current = loadCache()
const listeners = new Set()
let myUserId = null

function emit() {
  saveCache(current)
  listeners.forEach((fn) => fn(current))
}

export function setSessionUser(id) {
  myUserId = id || null
}

export function resetData() {
  current = emptyData()
  emit()
}

export function useStore() {
  const [data, setData] = useState(current)
  useEffect(() => {
    const fn = (d) => setData(d)
    listeners.add(fn)
    fn(current)
    return () => listeners.delete(fn)
  }, [])
  const update = useCallback((mutator) => {
    current = mutator({ ...current })
    emit()
  }, [])
  return [data, update]
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ── camelCase(앱) ↔ snake_case(DB) 매핑 ─────────────────────
function rowToBook(r) {
  return {
    id: r.id,
    title: r.title || '',
    author: r.author || '',
    cover: r.cover || '',
    status: r.status || 'want',
    totalPages: r.total_pages || 0,
    currentPage: r.current_page || 0,
    startDate: r.start_date || '',
    endDate: r.end_date || '',
    rating: r.rating || 0,
    oneLiner: r.one_liner || '',
    notes: r.notes || '',
    discussion: r.discussion || '',
    meetingId: r.meeting_id || '',
    createdAt: r.created_at || '',
    createdBy: r.created_by || '',
  }
}
function bookToRow(b) {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    cover: b.cover,
    status: b.status,
    total_pages: b.totalPages || 0,
    current_page: b.currentPage || 0,
    start_date: b.startDate || null,
    end_date: b.endDate || null,
    rating: b.rating || 0,
    one_liner: b.oneLiner || '',
    notes: b.notes || '',
    discussion: b.discussion || '',
    meeting_id: b.meetingId || null,
    created_at: b.createdAt || new Date().toISOString(),
    created_by: b.createdBy || myUserId,
  }
}
function rowToMeeting(r) {
  return {
    id: r.id,
    title: r.title || '',
    date: r.date || '',
    place: r.place || '',
    bookId: r.book_id || '',
    memo: r.memo || '',
    createdAt: r.created_at || '',
    createdBy: r.created_by || '',
  }
}
function meetingToRow(m) {
  return {
    id: m.id,
    title: m.title,
    date: m.date || null,
    place: m.place || '',
    book_id: m.bookId || null,
    memo: m.memo || '',
    created_at: m.createdAt || new Date().toISOString(),
    created_by: m.createdBy || myUserId,
  }
}

// 부분 패치(camelCase)를 DB 컬럼(snake_case)로 변환
const BOOK_COL = {
  title: 'title',
  author: 'author',
  cover: 'cover',
  status: 'status',
  totalPages: 'total_pages',
  currentPage: 'current_page',
  startDate: 'start_date',
  endDate: 'end_date',
  rating: 'rating',
  oneLiner: 'one_liner',
  notes: 'notes',
  discussion: 'discussion',
  meetingId: 'meeting_id',
}
const MEETING_COL = {
  title: 'title',
  date: 'date',
  place: 'place',
  bookId: 'book_id',
  memo: 'memo',
}
function patchToRow(patch, map) {
  const out = {}
  for (const k of Object.keys(patch)) {
    if (map[k]) {
      let v = patch[k]
      if (['start_date', 'end_date', 'date', 'meeting_id', 'book_id'].includes(map[k]))
        v = v || null
      out[map[k]] = v
    }
  }
  return out
}

// ── 서버 동기화 ──────────────────────────────────────────────
let channel = null

function logErr(where) {
  return ({ error }) => {
    if (error) console.error('[onbook] ' + where, error.message)
  }
}

export async function loadFromServer() {
  if (!supabase) return
  const [booksRes, meetingsRes, settingsRes] = await Promise.all([
    supabase.from('books').select('*').order('created_at', { ascending: false }),
    supabase.from('meetings').select('*'),
    supabase.from('settings').select('*').eq('id', 'group').maybeSingle(),
  ])
  current = {
    books: (booksRes.data || []).map(rowToBook),
    meetings: (meetingsRes.data || []).map(rowToMeeting),
    goal: settingsRes.data
      ? { year: settingsRes.data.year, target: settingsRes.data.target }
      : defaultGoal(),
  }
  emit()
}

export function startRealtime() {
  if (!supabase || channel) return
  channel = supabase
    .channel('onbook-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'books' },
      loadFromServer
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'meetings' },
      loadFromServer
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'settings' },
      loadFromServer
    )
    .subscribe()
}

export function stopRealtime() {
  if (channel && supabase) {
    supabase.removeChannel(channel)
    channel = null
  }
}

// ── 책 액션 (낙관적 로컬 반영 + 서버 기록) ───────────────────
export function addBook(update, book) {
  const newBook = {
    id: uid(),
    title: '',
    author: '',
    cover: '',
    status: 'want',
    totalPages: 0,
    currentPage: 0,
    startDate: '',
    endDate: '',
    rating: 0,
    oneLiner: '',
    notes: '',
    discussion: '',
    meetingId: '',
    createdAt: new Date().toISOString(),
    createdBy: myUserId || '',
    ...book,
  }
  update((d) => ({ ...d, books: [newBook, ...d.books] }))
  if (supabase) supabase.from('books').insert(bookToRow(newBook)).then(logErr('addBook'))
  return newBook
}

export function updateBook(update, id, patch) {
  update((d) => ({
    ...d,
    books: d.books.map((b) => (b.id === id ? { ...b, ...patch } : b)),
  }))
  if (supabase)
    supabase
      .from('books')
      .update(patchToRow(patch, BOOK_COL))
      .eq('id', id)
      .then(logErr('updateBook'))
}

export function removeBook(update, id) {
  update((d) => ({
    ...d,
    books: d.books.filter((b) => b.id !== id),
    meetings: d.meetings.map((m) =>
      m.bookId === id ? { ...m, bookId: '' } : m
    ),
  }))
  if (supabase) {
    supabase.from('books').delete().eq('id', id).then(logErr('removeBook'))
    supabase
      .from('meetings')
      .update({ book_id: null })
      .eq('book_id', id)
      .then(logErr('removeBook/meeting'))
  }
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
    createdBy: myUserId || '',
    ...meeting,
  }
  update((d) => ({ ...d, meetings: [...d.meetings, newMeeting] }))
  if (supabase)
    supabase.from('meetings').insert(meetingToRow(newMeeting)).then(logErr('addMeeting'))
  return newMeeting
}

export function updateMeeting(update, id, patch) {
  update((d) => ({
    ...d,
    meetings: d.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  }))
  if (supabase)
    supabase
      .from('meetings')
      .update(patchToRow(patch, MEETING_COL))
      .eq('id', id)
      .then(logErr('updateMeeting'))
}

export function removeMeeting(update, id) {
  update((d) => ({
    ...d,
    meetings: d.meetings.filter((m) => m.id !== id),
    books: d.books.map((b) =>
      b.meetingId === id ? { ...b, meetingId: '' } : b
    ),
  }))
  if (supabase) {
    supabase.from('meetings').delete().eq('id', id).then(logErr('removeMeeting'))
    supabase
      .from('books')
      .update({ meeting_id: null })
      .eq('meeting_id', id)
      .then(logErr('removeMeeting/book'))
  }
}

// ── 목표(공용 1개) ──────────────────────────────────────────
export function updateGoal(update, patch) {
  let next
  update((d) => {
    next = { ...d.goal, ...patch }
    return { ...d, goal: next }
  })
  if (supabase)
    supabase
      .from('settings')
      .upsert({ id: 'group', year: next.year, target: next.target })
      .then(logErr('updateGoal'))
}
