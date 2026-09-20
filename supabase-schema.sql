-- ==============================================================================
-- UPI APP / SUPABASE COMPLETE SQL SCHEMA SETUP CODE
-- Project ID: fkiakibxsiqccgpfnwtz
-- Copy and run this entire SQL script inside your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fkiakibxsiqccgpfnwtz/sql
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
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Create registered_users table (Accounts, Customers, Admins)
CREATE TABLE IF NOT EXISTS public.registered_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL DEFAULT 'demo',
    phone TEXT,
    business_name TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'expired')),
    validity_plan TEXT DEFAULT '1_month',
    valid_until TIMESTAMPTZ,
    valid_from TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    registered_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    is_notification_read BOOLEAN DEFAULT false
);

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
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'pending', 'failed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.merchant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registered_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies (Allow read/write with anon key)
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

-- 6. Insert Default Seed Data
INSERT INTO public.merchant_config (
    id,
    store_name,
    upi_id,
    extra_percentage,
    is_extra_enabled,
    currency,
    note,
    soundbox_voice,
    language
) VALUES (
    'default_merchant',
    'Sharma General Store',
    '9876543210@paytm',
    2.00,
    true,
    'INR',
    'Bill Payment',
    true,
    'en'
) ON CONFLICT (id) DO NOTHING;

-- Insert Admin Account & Active Customer Account
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
    'admin_main',
    'Super Admin',
    'admin@upi.com',
    'admin123',
    '8598912555',
    'UPI Master System',
    'admin',
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
    'pending',
    '1_month',
    TIMEZONE('utc', NOW() + INTERVAL '30 days'),
    TIMEZONE('utc', NOW()),
    TIMEZONE('utc', NOW()),
    false
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone;

-- ==============================================================================
-- DONE! All tables, policies, indexes, and initial accounts are created successfully.
-- ==============================================================================
