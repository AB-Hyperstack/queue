import { createClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS.
// Used by webhook handlers and server-side writes where there is no user session.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
