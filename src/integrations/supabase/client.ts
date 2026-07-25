import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { CURRENT_COLLEGE } from '@/config/college';

// The database is chosen ONCE, by hostname, before anything renders — so auth
// and every query in the session talk to the same project (never a mismatch).
// teamdino.in → GITAM's project · srm.teamdino.in → SRM's project.
const SUPABASE_URL = CURRENT_COLLEGE.supabaseUrl;
const SUPABASE_PUBLISHABLE_KEY = CURRENT_COLLEGE.supabaseKey;

// A per-college storage key so a GITAM session and an SRM session never collide
// in the same browser (belt-and-braces on top of per-origin isolation).
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    storageKey: `sb-${CURRENT_COLLEGE.slug}-auth`,
    persistSession: true,
    autoRefreshToken: true,
  }
});