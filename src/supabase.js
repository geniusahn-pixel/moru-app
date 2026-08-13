import { createClient } from '@supabase/supabase-js'
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
} from './supabaseConfig.js'

// 설정이 없으면 null. 화면에서 이 값으로 "설정 필요" 안내를 띄웁니다.
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export { isSupabaseConfigured }
