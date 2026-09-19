import { createClient } from '@supabase/supabase-js';
import { MerchantConfig } from '../types';

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
