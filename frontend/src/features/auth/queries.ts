import { createSupabaseClient } from "@/lib/supabase-server";

// protect 
export const getCurrent = async () => {
  const startTime = Date.now();
  console.log(`[SSR] [AuthQueries] getCurrent started: ${new Date().toISOString()}`);
  try {
    const supabase = await createSupabaseClient();
    console.log(`[SSR] [AuthQueries] createSupabaseClient completed in ${Date.now() - startTime}ms`);

    const { data: { user }, error } = await supabase.auth.getUser();
    console.log(`[SSR] [AuthQueries] getUser completed in ${Date.now() - startTime}ms. Success: ${!!user}`);

    if (error || !user) {
      return null;
    }

    return {
      $id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url,
      has_password: user.user_metadata?.has_password,
    };
  } catch (error) {
    console.error(`[SSR] [AuthQueries] Error in ${Date.now() - startTime}ms:`, error);
    return null;
  }
};
