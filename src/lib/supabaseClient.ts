import { createClient } from '@supabase/supabase-js'

// Singleton Supabase client to avoid multiple instances
let supabaseClient: any = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    )
  }
  return supabaseClient
}

// Lazy initialization to prevent multiple instances
let _supabase: any = null
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    if (!_supabase) {
      _supabase = getSupabaseClient()
    }
    return _supabase[prop]
  }
})

export default supabase