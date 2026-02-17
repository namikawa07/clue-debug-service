import { createSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
    console.log("[JWT Bridge] GET request received at:", new Date().toISOString());
    const startTime = Date.now();
    try {
        const supabase = await createSupabaseClient()
        console.log(`[JWT Bridge] Supabase client created in ${Date.now() - startTime}ms`);

        const { data: { session }, error } = await supabase.auth.getSession()
        console.log(`[JWT Bridge] getSession completed in ${Date.now() - startTime}ms. Error: ${error?.message || 'none'}`);

        if (error) {
            console.error("[JWT Bridge] Supabase session error:", error);
            return NextResponse.json({ error: 'Supabase session error' }, { status: 401 })
        }

        if (!session) {
            console.warn("[JWT Bridge] No active session found");
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        console.log(`[JWT Bridge] Session found for user: ${session.user.email} (${session.user.id}). Total time: ${Date.now() - startTime}ms`);

        return NextResponse.json({
            jwt: session.access_token,
            user_id: session.user.id
        })
    } catch (error) {
        console.error('[JWT Bridge] Unexpected error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
