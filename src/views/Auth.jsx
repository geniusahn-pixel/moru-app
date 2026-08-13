import { useState } from 'react'
import { useAuth } from '../auth.jsx'

export default function Auth() {
  const { signIn, signUp, configured } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [ok, setOk] = useState(null)

  if (!configured) {
    return (
      <div className="auth-wrap">
        <div className="auth-card card">
          <div className="auth-logo">📖</div>
          <h1 className="auth-title">온북</h1>
          <p className="auth-sub" style={{ marginBottom: 16 }}>
            서버 연결 설정이 아직 없습니다.
          </p>
          <p className="mini-note" style={{ textAlign: 'left' }}>
            관리자가 Supabase 프로젝트의 URL과 anon 키를{' '}
            <code>src/supabaseConfig.js</code> 에 입력하면 로그인·공유 기능이
            켜집니다.
          </p>
        </div>
      </div>
    )
  }

  async function submit(e) {
    e.preventDefault()
    setMsg(null)
    setOk(null)
    if (!email.trim() || pw.length < 6) {
      setMsg('이메일과 6자 이상 비밀번호를 입력해 주세요.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await signUp(email.trim(), pw)
        if (error) throw error
        if (data.session) {
          // 이메일 확인이 꺼져 있으면 바로 로그인됨
        } else {
          setOk('가입 완료! 이메일 확인이 필요할 수 있어요. 메일을 확인한 뒤 로그인해 주세요.')
          setMode('login')
        }
      } else {
        const { error } = await signIn(email.trim(), pw)
        if (error) throw error
      }
    } catch (err) {
      setMsg(translate(err.message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card card" onSubmit={submit}>
        <div className="auth-logo">📖</div>
        <h1 className="auth-title">온북</h1>
        <p className="auth-sub">독서모임 기록을 함께 남겨요</p>

        <div className="seg" style={{ marginTop: 18 }}>
          <button
            type="button"
            className={mode === 'login' ? 'on' : ''}
            onClick={() => {
              setMode('login')
              setMsg(null)
            }}
          >
            로그인
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'on' : ''}
            onClick={() => {
              setMode('signup')
              setMsg(null)
            }}
          >
            회원가입
          </button>
        </div>

        <div className="field">
          <label>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label>비밀번호</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="6자 이상"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </div>

        {msg && <div className="auth-msg err">{msg}</div>}
        {ok && <div className="auth-msg ok">{ok}</div>}

        <button className="btn primary block" type="submit" disabled={busy}>
          {busy ? '잠시만요…' : mode === 'signup' ? '가입하기' : '로그인'}
        </button>

        <p className="mini-note" style={{ textAlign: 'center', marginTop: 14 }}>
          가입한 모임원은 같은 책·모임·기록을 함께 봅니다.
        </p>
      </form>
    </div>
  )
}

// Supabase 에러 메시지 한글화
function translate(m = '') {
  if (/Invalid login credentials/i.test(m)) return '이메일 또는 비밀번호가 올바르지 않습니다.'
  if (/User already registered/i.test(m)) return '이미 가입된 이메일입니다. 로그인해 주세요.'
  if (/Password should be at least/i.test(m)) return '비밀번호는 6자 이상이어야 합니다.'
  if (/Email not confirmed/i.test(m)) return '이메일 확인이 필요합니다. 받은 메일의 링크를 눌러 주세요.'
  if (/rate limit|too many/i.test(m)) return '요청이 많습니다. 잠시 후 다시 시도해 주세요.'
  return m || '문제가 발생했습니다. 다시 시도해 주세요.'
}
