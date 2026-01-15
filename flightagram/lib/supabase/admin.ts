/**
 * Supabase Admin Client (Service Role)
 * Use this for backend operations that need to bypass RLS:
 * - Scheduler operations
 * - Webhook processing
 * - Telegram bot handlers
 *
 * NEVER expose this client to the browser!
 */

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Singleton instance for the admin client
let adminClient: SupabaseClient<Database> | null = null;

export function createAdminClient(): SupabaseClient<Database> {
  if (adminClient) {
    return adminClient;
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  adminClient = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return adminClient;
}

/**
 * Helper to get a fresh admin client (for testing or when you need isolation)
 */
export function createFreshAdminClient(): SupabaseClient<Database> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
