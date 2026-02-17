import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from '@/config'

export async function createSupabaseClient() {
  const startTime = Date.now();
  console.log(`[SSR] [SupabaseServer] createSupabaseClient started: ${new Date().toISOString()}`);

  const cookieStore = await cookies()
  console.log(`[SSR] [SupabaseServer] await cookies() took ${Date.now() - startTime}ms`);

  const client = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        const val = cookieStore.get(name)?.value
        return val
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
        }
      }
    }
  })

  console.log(`[SSR] [SupabaseServer] createServerClient completed in ${Date.now() - startTime}ms`);
  return client;
}

export async function createSupabaseAdminClient() {
  // Ensure the service role key is available
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  })
}