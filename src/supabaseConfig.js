// ─────────────────────────────────────────────────────────────
// Supabase 연결 설정
//
// 여기 두 값만 채우면 로그인 + 공용 데이터베이스가 연결됩니다.
// 두 값 모두 "공개되어도 안전한" 값입니다(anon 키는 공개용이며,
// 실제 데이터 보호는 Supabase의 Row Level Security 정책이 담당).
//
// 값 얻는 곳: Supabase 프로젝트 → Project Settings → API
//   - Project URL      → SUPABASE_URL
//   - Project API keys의 "anon public" 키 → SUPABASE_ANON_KEY
// ─────────────────────────────────────────────────────────────

export const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'
export const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY'

// 설정이 실제로 채워졌는지 여부 (플레이스홀더면 false)
export const isSupabaseConfigured =
  !SUPABASE_URL.includes('YOUR_PROJECT') &&
  !SUPABASE_ANON_KEY.includes('YOUR_ANON')
