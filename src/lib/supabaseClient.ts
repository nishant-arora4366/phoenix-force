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
          persistSession: false, // We manage sessions via JWT
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {}
        }
      }
    )
  }
  return supabaseClient
}

// Set the auth token for realtime subscriptions
// NOTE: We DON'T set custom JWT for realtime because:
// 1. Supabase Realtime expects Supabase-signed JWTs, not our custom JWTs
// 2. We've made tables public for SELECT via RLS policies
// 3. Write operations are protected via API routes with our custom JWT
export const setSupabaseAuth = (token: string | null) => {
  const client = getSupabaseClient()
  
  // Force disconnect all channels to clear old auth
  const channels = client.realtime.channels
  
  // Remove all existing channels
  channels.forEach((channel: any) => {
    channel.unsubscribe()
  })
  
  // Disconnect the realtime connection
  client.realtime.disconnect()
  
  // Clear the auth token
  client.realtime.setAuth(null)
  
  // Reconnect with anon key (no custom JWT)
  // The client will automatically reconnect when channels subscribe
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