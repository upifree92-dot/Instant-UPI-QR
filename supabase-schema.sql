-- ==============================================================================
-- 100% WORKING COMPLETE SQL SCRIPT FOR SUPABASE / POSTGRESQL
-- Project ID: fkiakibxsiqccgpfnwtz
-- Copy and paste everything below into Supabase SQL Editor and click "RUN":
-- ==============================================================================

-- 1. Create merchant_config table (Store & UPI Settings)
CREATE TABLE IF NOT EXISTS public.merchant_config (
    id TEXT PRIMARY KEY DEFAULT 'default_merchant',
    store_name TEXT NOT NULL DEFAULT 'Sharma General Store',
    upi_id TEXT NOT NULL DEFAULT '9876543210@paytm',
    extra_percentage NUMERIC(5, 2) DEFAULT 2.00,
    is_extra_enabled BOOLEAN DEFAULT true,
    currency TEXT DEFAULT 'INR',
    note TEXT DEFAULT 'Bill Payment',
    soundbox_voice BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'en',
    presets JSONB DEFAULT '[50, 100, 200, 500, 1000, 2000]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Ensure presets column exists if table was created previously
ALTER TABLE public.merchant_config ADD COLUMN IF NOT EXISTS presets JSONB DEFAULT '[50, 100, 200, 500, 1000, 2000]'::jsonb;

-- 2. Create registered_users table (Accounts, Customers, Admins)
CREATE TABLE IF NOT EXISTS public.registered_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL DEFAULT 'demo',
    phone TEXT,
    business_name TEXT,
    role TEXT NOT NULL DEFAULT 'customer',
    status TEXT NOT NULL DEFAULT 'active',
    validity_plan TEXT DEFAULT '1_month',
    valid_until TIMESTAMPTZ,
    valid_from TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    registered_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    is_notification_read BOOLEAN DEFAULT true
);

-- Ensure all columns exist if table was created earlier
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS validity_plan TEXT DEFAULT '1_month';
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS is_notification_read BOOLEAN DEFAULT true;

-- 3. Create transactions table (UPI Payment Logs)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.registered_users(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    extra_charge NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    upi_id TEXT NOT NULL,
    store_name TEXT,
    note TEXT,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.merchant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registered_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create Permissive RLS Policies (Allows Seamless Multi-PC Syncing)
DROP POLICY IF EXISTS "Public access to merchant_config" ON public.merchant_config;
CREATE POLICY "Public access to merchant_config"
    ON public.merchant_config FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to registered_users" ON public.registered_users;
CREATE POLICY "Public access to registered_users"
    ON public.registered_users FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to transactions" ON public.transactions;
CREATE POLICY "Public access to transactions"
    ON public.transactions FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Grant Full Permissions to anon, authenticated, and service_role
GRANT ALL ON TABLE public.merchant_config TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.registered_users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.transactions TO anon, authenticated, service_role;

-- 7. Insert or Update Default Store Configuration
INSERT INTO public.merchant_config (
    id,
    store_name,
    upi_id,
    extra_percentage,
    is_extra_enabled,
    currency,
    note,
    soundbox_voice,
    language,
    presets
) VALUES (
    'default_merchant',
    'Sharma General Store',
    'sharmastore@okhdfcbank',
    2.00,
    true,
    'INR',
    'Bill Payment',
    true,
    'en',
    '[50, 100, 200, 500, 1000, 2000]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    store_name = EXCLUDED.store_name,
    upi_id = EXCLUDED.upi_id;

-- 8. Insert or Update Accounts (Admin & Active Customers)
INSERT INTO public.registered_users (
    id,
    name,
    email,
    password,
    phone,
    business_name,
    role,
    status,
    validity_plan,
    valid_until,
    valid_from,
    registered_at,
    is_notification_read
) VALUES 
(
    'admin_kgfilewala',
    'Super Admin',
    'kgfilewala@gmail.com',
    'bbbb@9090',
    '8598912555',
    'UPI Master Admin',
    'admin',
    'active',
    'lifetime',
    TIMEZONE('utc', NOW() + INTERVAL '10 years'),
    TIMEZONE('utc', NOW()),
    TIMEZONE('utc', NOW()),
    true
),
(
    'user_demo9090',
    'Demo User',
    'demo9090',
    'demo9090',
    '9090909090',
    'Demo Store',
    'customer',
    'active',
    'lifetime',
    TIMEZONE('utc', NOW() + INTERVAL '10 years'),
    TIMEZONE('utc', NOW()),
    TIMEZONE('utc', NOW()),
    true
),
(
    'user_upifree92',
    'Upi',
    'upifree92@gmail.com',
    'demo',
    '8598912555',
    'Upi Digital Store',
    'customer',
    'active',
    '1_month',
    TIMEZONE('utc', NOW() + INTERVAL '30 days'),
    TIMEZONE('utc', NOW()),
    TIMEZONE('utc', NOW()),
    true
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    phone = EXCLUDED.phone,
    business_name = EXCLUDED.business_name,
    status = 'active',
    validity_plan = EXCLUDED.validity_plan,
    valid_until = EXCLUDED.valid_until,
    is_notification_read = true;

-- 9. Guarantee that upifree92@gmail.com is instantly active
UPDATE public.registered_users 
SET status = 'active',
    valid_until = TIMEZONE('utc', NOW() + INTERVAL '30 days'),
    is_notification_read = true
WHERE email = 'upifree92@gmail.com';

-- 10. Permanently remove admin@upi.com
DELETE FROM public.registered_users WHERE email = 'admin@upi.com' OR id = 'admin_main';

-- ==============================================================================
-- DONE! All tables, policies, permissions, and accounts are 100% active and ready.
-- ==============================================================================
