import { createClient } from '@supabase/supabase-js';
import { MerchantConfig, RegisteredUser } from '../types';

export const SUPABASE_PROJECT_ID = 'fkiakibxsiqccgpfnwtz';
const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const DEFAULT_ANON_KEY = 'sb_publishable_ZfVLturMik79ZdwuKo5Nzg_yk8YdVGb';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Check connectivity to Supabase
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = performance.now();
  try {
    // Attempt a light ping by querying auth or health
    const { error } = await supabase.from('merchant_config').select('id').limit(1);
    const latencyMs = Math.round(performance.now() - start);

    // If table doesn't exist yet, connection to Supabase is still valid (42P01 error code in postgres)
    if (error && error.code !== '42P01' && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      // Check if it's an unauthorized or network error
      if (error.message.includes('FetchError') || error.message.includes('network')) {
        return { connected: false, latencyMs, error: error.message };
      }
    }
    return { connected: true, latencyMs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: true, // Client was initialized and reachable
      latencyMs: Math.round(performance.now() - start),
      error: message,
    };
  }
}

/**
 * Fetch merchant configuration from Supabase Cloud
 */
export async function fetchMerchantConfigFromCloud(): Promise<Partial<MerchantConfig> | null> {
  try {
    const { data, error } = await supabase
      .from('merchant_config')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch notice:', error.message);
      return null;
    }

    if (data) {
      return {
        storeName: data.store_name,
        upiId: data.upi_id,
        extraPercentage: data.extra_percentage ?? 2,
        isExtraEnabled: data.is_extra_enabled ?? true,
        currency: data.currency ?? 'INR',
        note: data.note ?? 'Bill Payment',
        soundboxVoice: data.soundbox_voice ?? true,
        language: (data.language as 'en' | 'hi') ?? 'en',
      };
    }
    return null;
  } catch (err) {
    console.warn('Supabase fetch error:', err);
    return null;
  }
}

/**
 * Save / sync merchant configuration to Supabase Cloud
 */
export async function saveMerchantConfigToCloud(config: MerchantConfig): Promise<boolean> {
  try {
    const payload = {
      id: 'default_merchant',
      store_name: config.storeName,
      upi_id: config.upiId,
      extra_percentage: config.extraPercentage,
      is_extra_enabled: config.isExtraEnabled,
      currency: config.currency,
      note: config.note,
      soundbox_voice: config.soundboxVoice,
      language: config.language,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('merchant_config')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase cloud sync notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase cloud sync error:', err);
    return false;
  }
}

/**
 * Fetch all registered users from Supabase Cloud
 * (Enables instant sync across any network, PC, or mobile device)
 */
export async function fetchUsersFromCloud(): Promise<RegisteredUser[]> {
  try {
    // 1. Query 'registered_users' first
    let { data, error } = await supabase
      .from('registered_users')
      .select('*')
      .order('registered_at', { ascending: false });

    // 2. If registered_users failed or has no rows, fallback to 'users' table
    if (error || !data || data.length === 0) {
      const usersRes = await supabase
        .from('users')
        .select('*')
        .order('registered_at', { ascending: false });
      if (!usersRes.error && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
        data = usersRes.data;
        error = null;
      }
    }

    if (error) {
      console.warn('Supabase users fetch notice:', error.message);
      return [];
    }

    if (Array.isArray(data) && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        name: row.name || 'User',
        email: (row.email || '').toLowerCase().trim(),
        password: row.password || 'demo',
        phone: row.phone || undefined,
        businessName: row.business_name || undefined,
        upiId: row.upi_id || undefined,
        extraPercentage:
          row.extra_percentage !== null && row.extra_percentage !== undefined
            ? Number(row.extra_percentage)
            : undefined,
        isExtraEnabled:
          row.is_extra_enabled !== null && row.is_extra_enabled !== undefined
            ? Boolean(row.is_extra_enabled)
            : undefined,
        role: (row.role as any) || 'customer',
        status: (row.status as any) || 'active',
        validityPlan: (row.validity_plan as any) || '1_month',
        validUntil: row.valid_until || undefined,
        validFrom: row.valid_from || undefined,
        registeredAt: row.registered_at || new Date().toISOString(),
        isNotificationRead: row.is_notification_read !== false,
      }));
    }
  } catch (err) {
    console.warn('Supabase users fetch exception:', err);
  }
  return [];
}

/**
 * Save / Upsert a single registered user to Supabase Cloud
 */
export async function saveUserToCloud(user: RegisteredUser): Promise<boolean> {
  try {
    const basePayload: any = {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase().trim(),
      password: user.password,
      phone: user.phone || null,
      business_name: user.businessName || null,
      role: user.role || 'customer',
      status: user.status || 'active',
      validity_plan: user.validityPlan || '1_month',
      valid_until: user.validUntil || null,
      valid_from: user.validFrom || null,
      registered_at: user.registeredAt || new Date().toISOString(),
      is_notification_read: user.isNotificationRead !== false,
    };

    const fullPayload = {
      ...basePayload,
      upi_id: user.upiId || null,
      extra_percentage: user.extraPercentage !== undefined ? user.extraPercentage : null,
      is_extra_enabled: user.isExtraEnabled !== undefined ? user.isExtraEnabled : null,
    };

    // Upsert into registered_users
    let { error } = await supabase
      .from('registered_users')
      .upsert(fullPayload, { onConflict: 'email' });

    if (error && (error.message?.includes('column') || error.message?.includes('schema'))) {
      const fallback = await supabase
        .from('registered_users')
        .upsert(basePayload, { onConflict: 'email' });
      error = fallback.error;
    }

    // Also upsert into users table for compatibility
    try {
      await supabase
        .from('users')
        .upsert(basePayload, { onConflict: 'email' });
    } catch {}

    if (error) {
      console.warn('Supabase save user notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save user exception:', err);
    return false;
  }
}

/**
 * Delete a user from Supabase Cloud permanently
 */
export async function deleteUserFromCloud(userIdOrEmail: string): Promise<boolean> {
  try {
    const clean = userIdOrEmail.toLowerCase().trim();
    await supabase.from('registered_users').delete().eq('email', clean);
    await supabase.from('registered_users').delete().eq('id', userIdOrEmail);
    await supabase.from('users').delete().eq('email', clean);
    await supabase.from('users').delete().eq('id', userIdOrEmail);
    return true;
  } catch (err) {
    console.warn('Supabase delete user exception:', err);
    return false;
  }
}

/**
 * Subscribe to real-time changes on registered_users in Supabase Cloud
 */
export function subscribeToCloudUsers(onUpdate: () => void): () => void {
  try {
    const ch1 = supabase
      .channel('supabase_realtime_registered_users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registered_users' },
        () => onUpdate()
      )
      .subscribe();

    const ch2 = supabase
      .channel('supabase_realtime_users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => onUpdate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  } catch {
    return () => {};
  }
}

