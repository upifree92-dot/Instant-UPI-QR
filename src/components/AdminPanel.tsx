import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Store,
  CreditCard,
  Percent,
  Volume2,
  Database,
  Cloud,
  Save,
  Check,
  RefreshCw,
  Copy,
  LogOut,
  QrCode,
  Users,
  Settings,
  Plus,
  Trash2,
  ExternalLink,
  Activity,
  DollarSign,
  AlertCircle,
  Radio,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  UserPlus,
  Eye,
  EyeOff,
  User,
  Phone,
  Search,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Sparkles,
  ArrowRight,
  Server,
  Layers,
  KeyRound,
  ChevronRight,
  X,
  Share2,
  CheckCheck,
  Download,
} from 'lucide-react';
import { MerchantConfig, PresetAmount, RegisteredUser, ValidityPlan } from '../types';
import {
  SUPABASE_PROJECT_ID,
  checkSupabaseConnection,
  saveMerchantConfigToCloud,
} from '../lib/supabase';
import { announceSoundbox } from '../utils/sound';
import {
  getRegisteredUsers,
  updateUserStatus,
  deleteRegisteredUser,
  registerCustomer,
  markAllNotificationsRead,
  getUnreadRegistrationCount,
  VALIDITY_PLANS,
  updateUserValidity,
  getUserValidityInfo,
  updateUserPassword,
} from '../lib/userStore';

interface AdminPanelProps {
  config: MerchantConfig;
  onSaveConfig: (newConfig: MerchantConfig) => void;
  onSwitchToTerminal: () => void;
  onLogout: () => void;
  initialTab?: 'roles' | 'config' | 'database' | 'presets';
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  config,
  onSaveConfig,
  onSwitchToTerminal,
  onLogout,
  initialTab = 'roles',
}) => {
  const [formData, setFormData] = useState<MerchantConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<'roles' | 'config' | 'database' | 'presets'>(
    initialTab || 'roles'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Customer Registrations & Notification state
  const [usersList, setUsersList] = useState<RegisteredUser[]>(() => getRegisteredUsers());
  const [unreadNotifications, setUnreadNotifications] = useState<number>(() =>
    getUnreadRegistrationCount()
  );
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<
    'all' | 'pending' | 'active' | 'expired' | 'rejected'
  >('all');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [selectedCustomer, setSelectedCustomer] = useState<RegisteredUser | null>(null);
  const [copiedCustomerId, setCopiedCustomerId] = useState<string | null>(null);
  const [modalPasswordVisible, setModalPasswordVisible] = useState(false);
  const [copiedModalField, setCopiedModalField] = useState<string | null>(null);
  const [validityToast, setValidityToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  // Admin-only Password Change state
  const [editingPasswordUser, setEditingPasswordUser] = useState<RegisteredUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(true);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  // New Customer Form inside Admin
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addStore, setAddStore] = useState('');
  const [addStatus, setAddStatus] = useState<'active' | 'pending'>('active');
  const [addValidityPlan, setAddValidityPlan] = useState<ValidityPlan>('1_month');
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Editable presets stored in localStorage
  const [presets, setPresets] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('upi_merchant_presets_list');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [50, 100, 200, 500, 1000, 2000];
  });
  const [newPresetVal, setNewPresetVal] = useState<string>('');

  useEffect(() => {
    setFormData({ ...config });
  }, [config]);

  // Test Supabase connectivity on mount
  useEffect(() => {
    handleTestPing();
  }, []);

  const handleTestPing = async () => {
    setIsPinging(true);
    const result = await checkSupabaseConnection();
    setIsPinging(false);
    setPingLatency(result.latencyMs);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: MerchantConfig = {
      ...formData,
      storeName: formData.storeName.trim() || config.storeName,
      upiId: formData.upiId.trim() || config.upiId,
    };
    onSaveConfig(updated);
    setSaveSuccess(true);

    // Also sync to cloud
    setCloudSyncing(true);
    const cloudOk = await saveMerchantConfigToCloud(updated);
    setCloudSyncing(false);
    setSyncStatus(cloudOk ? 'Synced to Supabase Cloud' : 'Saved in local storage');

    setTimeout(() => {
      setSaveSuccess(false);
      setSyncStatus(null);
    }, 3000);
  };

  const handleAddPreset = () => {
    const val = parseInt(newPresetVal, 10);
    if (!isNaN(val) && val > 0 && !presets.includes(val)) {
      const updated = [...presets, val].sort((a, b) => a - b);
      setPresets(updated);
      try {
        localStorage.setItem('upi_merchant_presets_list', JSON.stringify(updated));
      } catch {
        // ignore
      }
      setNewPresetVal('');
    }
  };

  const handleRemovePreset = (val: number) => {
    const updated = presets.filter((p) => p !== val);
    setPresets(updated);
    try {
      localStorage.setItem('upi_merchant_presets_list', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const FULL_DATABASE_SQL = `-- ==============================================================================
-- 1. USERS & VALIDITY PACKAGES TABLE (1 Month ₹500, 1 Year ₹2999, etc.)
-- ==============================================================================
create table if not exists users (
  id text primary key,
  name text not null,
  email text unique not null,
  password text not null,
  phone text,
  business_name text,
  role text default 'customer' check (role in ('admin', 'customer', 'merchant')),
  status text default 'pending' check (status in ('pending', 'active', 'rejected')),
  validity_plan text default '1_month' check (validity_plan in ('1_month', '3_months', '6_months', '1_year', 'lifetime')),
  plan_price numeric default 500,
  valid_from timestamptz default now(),
  valid_until timestamptz not null,
  registered_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ==============================================================================
-- 2. MERCHANT & SOUNDBOX QR CONFIGURATION TABLE
-- ==============================================================================
create table if not exists merchant_config (
  id text primary key default 'default_merchant',
  store_name text,
  upi_id text,
  extra_percentage numeric default 2,
  is_extra_enabled boolean default true,
  currency text default 'INR',
  note text default 'Bill Payment',
  soundbox_voice boolean default true,
  language text default 'en',
  updated_at timestamptz default now()
);

-- ==============================================================================
-- 3. TRANSACTIONS & BILL PAYMENTS TABLE
-- ==============================================================================
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  amount numeric not null,
  extra_percentage numeric default 0,
  final_amount numeric not null,
  customer_name text,
  customer_vpa text,
  status text default 'completed' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz default now()
);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table users enable row level security;
create policy "Allow all access to users" on users for all using (true) with check (true);

alter table merchant_config enable row level security;
create policy "Allow all access to merchant_config" on merchant_config for all using (true) with check (true);

alter table transactions enable row level security;
create policy "Allow all access to transactions" on transactions for all using (true) with check (true);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(FULL_DATABASE_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadSql = () => {
    try {
      const blob = new Blob([FULL_DATABASE_SQL], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'upi_payment_schema.sql';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download SQL file', e);
    }
  };

  const handleTestVoice = () => {
    announceSoundbox(102, formData.language, formData.storeName);
  };

  const refreshUsersData = () => {
    const list = getRegisteredUsers();
    setUsersList(list);
    setUnreadNotifications(getUnreadRegistrationCount());
    setSelectedCustomer((prev) => (prev ? list.find((u) => u.id === prev.id) || null : null));
  };

  const [customerToDelete, setCustomerToDelete] = useState<RegisteredUser | null>(null);

  const handleUpdateStatus = (
    userId: string,
    newStatus: 'active' | 'pending' | 'rejected',
    plan: ValidityPlan = '1_month'
  ) => {
    const targetUser = usersList.find((u) => u.id === userId);
    updateUserStatus(userId, newStatus, plan);
    refreshUsersData();

    if (newStatus === 'active') {
      const planItem = VALIDITY_PLANS.find((p) => p.id === plan);
      setValidityToast({
        message: `Account for ${targetUser?.email || targetUser?.name || 'Customer'} activated successfully (${planItem?.label || plan})!`,
        type: 'success',
      });
    } else if (newStatus === 'rejected') {
      setValidityToast({
        message: `Customer ${targetUser?.email || targetUser?.name || ''} has been REJECTED.`,
        type: 'error',
      });
    } else if (newStatus === 'pending') {
      setValidityToast({
        message: `Customer ${targetUser?.email || targetUser?.name || ''} marked as Pending.`,
        type: 'info',
      });
    }
    setTimeout(() => setValidityToast(null), 4000);
  };

  const handleSetCustomerValidity = (
    userId: string,
    plan: ValidityPlan,
    userName: string
  ) => {
    const res = updateUserValidity(userId, plan, false);
    if (res.success) {
      refreshUsersData();
      const planItem = VALIDITY_PLANS.find((p) => p.id === plan);
      const planLabel = planItem ? planItem.label : plan;
      const validityInfo = res.user ? getUserValidityInfo(res.user) : null;
      setValidityToast({
        message: `${userName} validity set to ${planLabel}! Valid until: ${validityInfo?.formattedExpiry || ''}`,
        type: 'success',
      });
      setTimeout(() => {
        setValidityToast(null);
      }, 4000);
    }
  };

  const handleDeleteCustomer = (userId: string) => {
    const target = usersList.find((u) => u.id === userId);
    if (target) {
      setCustomerToDelete(target);
    }
  };

  const handleConfirmDeleteCustomer = () => {
    if (!customerToDelete) return;
    const target = customerToDelete;
    if (target.role === 'admin' || target.email.toLowerCase() === 'kgfilewala@gmail.com') {
      alert('Super Admin account cannot be deleted.');
      setCustomerToDelete(null);
      return;
    }

    const success = deleteRegisteredUser(target.id);
    if (success) {
      if (selectedCustomer?.id === target.id) {
        setSelectedCustomer(null);
      }
      setCustomerToDelete(null);
      refreshUsersData();
      setValidityToast({
        message: `Customer ${target.email || target.name} deleted permanently.`,
        type: 'info',
      });
      setTimeout(() => setValidityToast(null), 4000);
    }
  };

  const handleCopyCustomerCredentials = (user: RegisteredUser) => {
    const validityInfo = getUserValidityInfo(user);
    const text = `*UPI SOUNDBOX MERCHANT ACCESS*
━━━━━━━━━━━━━━━━━━━━━━
🏪 Store Name: ${user.businessName || 'Merchant Store'}
👤 Login ID: ${user.email}
🔑 Password: ${user.password}
📱 Phone: ${user.phone || 'N/A'}
💳 UPI ID: ${user.upiId || 'sharmastore@okhdfcbank'}
⚡ Auto Surcharge: ${user.isExtraEnabled !== false ? `+${user.extraPercentage ?? 2}%` : 'Disabled'}
📅 Validity: ${validityInfo.planLabel} (${validityInfo.isLifetime ? 'Lifetime' : `Valid till ${validityInfo.formattedExpiry}`})
━━━━━━━━━━━━━━━━━━━━━━
🌐 Login Portal: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setCopiedCustomerId(user.id);
    setTimeout(() => setCopiedCustomerId(null), 2500);
  };

  const handleCopyField = (val: string, fieldName: string) => {
    navigator.clipboard.writeText(val);
    setCopiedModalField(fieldName);
    setTimeout(() => setCopiedModalField(null), 2000);
  };

  const handleTogglePassword = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStartChangePassword = (user: RegisteredUser) => {
    setEditingPasswordUser(user);
    setNewPasswordInput('');
    setPasswordChangeSuccess(null);
    setPasswordChangeError(null);
    setShowNewPassword(true);
  };

  const handleSaveChangedPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingPasswordUser) return;
    const trimmed = newPasswordInput.trim();
    if (!trimmed || trimmed.length < 3) {
      setPasswordChangeError('Password must be at least 3 characters long');
      return;
    }

    const res = updateUserPassword(editingPasswordUser.id, trimmed);
    if (!res.success) {
      setPasswordChangeError(res.error || 'Failed to update password');
      return;
    }

    setPasswordChangeError(null);
    setPasswordChangeSuccess(`Password updated successfully! New password: "${trimmed}"`);
    refreshUsersData();
    if (selectedCustomer && selectedCustomer.id === editingPasswordUser.id) {
      setSelectedCustomer((prev) => (prev ? { ...prev, password: trimmed } : null));
    }
    setValidityToast({
      message: `Password changed for ${editingPasswordUser.name} (${editingPasswordUser.email}) to "${trimmed}"!`,
      type: 'success',
    });
    setTimeout(() => {
      setValidityToast(null);
    }, 4000);

    setTimeout(() => {
      setEditingPasswordUser(null);
      setPasswordChangeSuccess(null);
    }, 1800);
  };

  const handleGeneratePinPassword = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setNewPasswordInput(randomPin);
    setPasswordChangeError(null);
  };

  const handleGenerateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(res);
    setPasswordChangeError(null);
  };

  const handleMarkNotificationsRead = () => {
    markAllNotificationsRead();
    refreshUsersData();
    setShowNotificationsMenu(false);
  };

  const handleAdminAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    if (!addName.trim()) {
      setAddError('Customer Name is required');
      return;
    }
    if (!addEmail.trim()) {
      setAddError('Email or User ID is required');
      return;
    }
    if (!addPassword || addPassword.length < 3) {
      setAddError('Password must be at least 3 characters');
      return;
    }

    const res = registerCustomer({
      name: addName.trim(),
      email: addEmail.trim(),
      password: addPassword.trim(),
      phone: addPhone.trim(),
      businessName: addStore.trim(),
      role: 'customer',
      status: addStatus,
      validityPlan: addValidityPlan,
    });

    if (!res.success) {
      setAddError(res.error || 'Failed to register customer');
      return;
    }

    const planItem = VALIDITY_PLANS.find((p) => p.id === addValidityPlan);
    setAddSuccess(
      `Customer ${addName} registered successfully (${
        addStatus === 'active' ? `Valid - ${planItem?.label}` : 'Pending Validation'
      })!`
    );
    refreshUsersData();

    setAddName('');
    setAddEmail('');
    setAddPassword('');
    setAddPhone('');
    setAddStore('');
    setAddStatus('active');
    setAddValidityPlan('1_month');

    setTimeout(() => {
      setShowAddCustomerModal(false);
      setAddSuccess(null);
    }, 1300);
  };

  const isCustomerUser = (u: RegisteredUser) =>
    u.role !== 'admin' &&
    u.email.toLowerCase() !== 'kgfilewala@gmail.com' &&
    u.email.toLowerCase() !== 'demo11';

  // Metrics calculation
  const totalCustomers = usersList.filter(isCustomerUser).length;
  const activeCustomers = usersList.filter(
    (u) => isCustomerUser(u) && u.status === 'active' && !getUserValidityInfo(u).isExpired
  ).length;
  const expiredCustomers = usersList.filter(
    (u) => isCustomerUser(u) && getUserValidityInfo(u).isExpired
  ).length;
  const pendingCustomers = usersList.filter(
    (u) => isCustomerUser(u) && u.status === 'pending'
  ).length;

  // Filtered customer list
  const filteredUsers = usersList.filter((u) => {
    if (!isCustomerUser(u)) return false;

    if (userStatusFilter === 'expired') {
      const v = getUserValidityInfo(u);
      if (!v.isExpired) return false;
    } else if (userStatusFilter === 'active') {
      const v = getUserValidityInfo(u);
      if (u.status !== 'active' || v.isExpired) return false;
    } else if (userStatusFilter !== 'all') {
      if (u.status !== userStatusFilter) return false;
    }

    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchPhone = u.phone?.toLowerCase().includes(q) || false;
      const matchStore = u.businessName?.toLowerCase().includes(q) || false;
      return matchName || matchEmail || matchPhone || matchStore;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100/70 py-6 px-3 sm:px-6 lg:px-8 selection:bg-emerald-200">
      <div className="w-full max-w-5xl mx-auto space-y-5">
        {/* Executive Header */}
        <header className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-emerald-400 flex items-center justify-center shadow-md border border-slate-700/50">
              <ShieldCheck className="w-6 h-6 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                  Admin Control Center
                </h1>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Customer validations, instant validity extensions, POS terminal & cloud sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Notification Bell */}
            <div className="relative">
              <button
                id="btn-admin-notifications"
                type="button"
                onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  unreadNotifications > 0
                    ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-200/60'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Customer Registration Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotificationsMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-2 font-black text-xs text-slate-900">
                      <Bell className="w-4 h-4 text-emerald-600" />
                      <span>Registration Alerts</span>
                      {unreadNotifications > 0 && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {unreadNotifications} New
                        </span>
                      )}
                    </div>
                    {unreadNotifications > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkNotificationsRead}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {usersList.filter(isCustomerUser).length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No customer registrations yet.
                      </div>
                    ) : (
                      usersList
                        .filter(isCustomerUser)
                        .slice(0, 6)
                        .map((u) => (
                          <div
                            key={u.id}
                            className={`p-3 rounded-xl border text-xs transition-colors ${
                              !u.isNotificationRead
                                ? 'bg-amber-50/70 border-amber-200'
                                : 'bg-slate-50 border-slate-200/80'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900">
                                {u.name}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  u.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {u.status === 'active' ? 'Valid' : 'Pending'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between font-mono">
                              <span>{u.email}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(u.registeredAt).toLocaleDateString()}
                              </span>
                            </div>
                            {u.status !== 'active' && (
                              <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between gap-1">
                                <span className="text-[10px] font-bold text-amber-900">
                                  Approve For:
                                </span>
                                <div className="flex gap-1">
                                  {(['1_month', '3_months', '6_months', '1_year'] as ValidityPlan[]).map(
                                    (planKey) => {
                                      const labels: Record<string, string> = {
                                        '1_month': '1M',
                                        '3_months': '3M',
                                        '6_months': '6M',
                                        '1_year': '1Y',
                                      };
                                      return (
                                        <button
                                          key={planKey}
                                          type="button"
                                          onClick={() => {
                                            handleSetCustomerValidity(u.id, planKey, u.name);
                                            handleMarkNotificationsRead();
                                          }}
                                          className="py-0.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-md transition-all active:scale-95 cursor-pointer shadow-2xs"
                                        >
                                          +{labels[planKey]}
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('roles');
                      setShowNotificationsMenu(false);
                    }}
                    className="mt-3 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>View All Customers</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Switch to Terminal */}
            <button
              id="btn-switch-to-terminal"
              type="button"
              onClick={onSwitchToTerminal}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>POS Terminal</span>
            </button>

            {/* Logout */}
            <button
              id="btn-admin-logout"
              type="button"
              onClick={onLogout}
              title="Logout from Admin"
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Executive KPI Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Total Customers */}
          <div
            onClick={() => {
              setActiveTab('roles');
              setUserStatusFilter('all');
            }}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Customers</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {totalCustomers}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Registered</span>
            </div>
          </div>

          {/* Card 2: Valid Active */}
          <div
            onClick={() => {
              setActiveTab('roles');
              setUserStatusFilter('active');
            }}
            className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Valid & Active</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-700 tracking-tight">
                {activeCustomers}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Live Login
              </span>
            </div>
          </div>

          {/* Card 3: Pending Approvals */}
          <div
            onClick={() => {
              setActiveTab('roles');
              setUserStatusFilter('pending');
            }}
            className={`rounded-2xl border p-4 shadow-xs transition-all cursor-pointer group ${
              pendingCustomers > 0
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-200/60'
                : 'bg-white border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Action</span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-800 tracking-tight">
                {pendingCustomers}
              </span>
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                  pendingCustomers > 0
                    ? 'bg-amber-200/80 text-amber-900 animate-pulse'
                    : 'text-slate-400 bg-slate-100'
                }`}
              >
                {pendingCustomers > 0 ? 'Action Needed' : 'None'}
              </span>
            </div>
          </div>

          {/* Card 4: Supabase Cloud Health */}
          <div
            onClick={() => setActiveTab('database')}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Database Cloud</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Database className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900">
                {pingLatency !== null ? `${pingLatency}ms` : 'Ready'}
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Supabase
              </span>
            </div>
          </div>
        </div>

        {/* Modern Segmented Navigation Tabs */}
        <nav className="bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-xs flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers & Accounts</span>
            {pendingCustomers > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingCustomers}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'config'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Store & UPI Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'database'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase Cloud</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Cashier Preset Chips</span>
          </button>
        </nav>

        {/* TAB 1: CUSTOMERS & ROLES */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            {/* Header & Filter Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Customer Account Management</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View customer login credentials, change access status, and assign validity duration
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Register New Customer</span>
                </button>
              </div>

              {/* Toast Banner */}
              {validityToast && (
                <div
                  className={`p-3.5 rounded-xl text-white shadow-md flex items-center justify-between gap-3 animate-in fade-in ${
                    validityToast.type === 'error'
                      ? 'bg-rose-600'
                      : validityToast.type === 'info'
                      ? 'bg-slate-900'
                      : 'bg-emerald-600'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-extrabold">
                    {validityToast.type === 'error' ? (
                      <XCircle className="w-4 h-4 text-rose-200 shrink-0" />
                    ) : validityToast.type === 'info' ? (
                      <AlertCircle className="w-4 h-4 text-slate-300 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                    )}
                    <span>{validityToast.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValidityToast(null)}
                    className="text-white/80 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Batch Pending Banner */}
              {pendingCustomers > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-100/60 border border-amber-300 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-amber-950 text-xs font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>{pendingCustomers} New Registration(s) — Gmail Activation Required!</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] font-bold text-amber-900">
                      1-Click Approve & Activate All For:
                    </span>
                    {(['1_month', '3_months', '6_months', '1_year'] as ValidityPlan[]).map((pKey) => {
                      const labelMap: Record<string, string> = {
                        '1_month': '1 Month',
                        '3_months': '3 Months',
                        '6_months': '6 Months',
                        '1_year': '1 Year',
                      };
                      return (
                        <button
                          key={pKey}
                          type="button"
                          onClick={() => {
                            usersList
                              .filter((u) => isCustomerUser(u) && u.status === 'pending')
                              .forEach((u) => {
                                updateUserStatus(u.id, 'active', pKey);
                              });
                            markAllNotificationsRead();
                            refreshUsersData();
                            setValidityToast({
                              message: `All pending customer accounts validated with ${labelMap[pKey]} validity!`,
                              type: 'success',
                            });
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg active:scale-95 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{labelMap[pKey]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search & Filter Strip */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by customer name, login email, phone number, store..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                  />
                  {userSearch && (
                    <button
                      type="button"
                      onClick={() => setUserSearch('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {(['all', 'active', 'pending', 'expired', 'rejected'] as const).map((filter) => {
                    const count =
                      filter === 'all'
                        ? totalCustomers
                        : filter === 'active'
                        ? activeCustomers
                        : filter === 'pending'
                        ? pendingCustomers
                        : filter === 'expired'
                        ? expiredCustomers
                        : usersList.filter((u) => isCustomerUser(u) && u.status === 'rejected').length;

                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setUserStatusFilter(filter)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold capitalize transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          userStatusFilter === filter
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                      >
                        <span>
                          {filter === 'all'
                            ? 'All'
                            : filter === 'active'
                            ? 'Valid'
                            : filter === 'pending'
                            ? 'Pending'
                            : filter === 'expired'
                            ? 'Expired'
                            : 'Rejected'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            userStatusFilter === filter
                              ? 'bg-slate-800 text-slate-200'
                              : 'bg-white text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ONE-PAGE CUSTOMER DIRECTORY: TABLE VIEW (DESKTOP & TABLET) */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 p-6">
                  <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-extrabold text-slate-700">No customers found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try changing search query or register a new customer above.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Customer & Store</th>
                        <th className="py-3 px-4">Login ID</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">UPI & Fee</th>
                        <th className="py-3 px-4">Validity Plan</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredUsers.map((user) => {
                        const validityInfo = getUserValidityInfo(user);

                        return (
                          <tr
                            key={user.id}
                            onClick={() => setSelectedCustomer(user)}
                            className={`group cursor-pointer transition-colors ${
                              user.status === 'pending'
                                ? 'bg-amber-50/30 hover:bg-amber-100/50'
                                : validityInfo.isExpired
                                ? 'bg-rose-50/30 hover:bg-rose-100/50'
                                : 'hover:bg-emerald-50/50'
                            }`}
                            title="Click to view full customer details"
                          >
                            {/* Customer & Store */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                                    <span>{user.name}</span>
                                    {user.role === 'admin' && (
                                      <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.2 rounded">
                                        ADMIN
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-semibold truncate max-w-[150px]">
                                    {user.businessName || 'Merchant Store'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Login ID */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 font-mono text-xs text-slate-800">
                                <span className="truncate max-w-[160px]">{user.email}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyField(user.email, `id_${user.id}`);
                                  }}
                                  className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                  title="Copy Login ID"
                                >
                                  {copiedModalField === `id_${user.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Phone */}
                            <td className="py-3.5 px-4 font-mono text-slate-600">
                              {user.phone ? (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {user.phone}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>

                            {/* UPI ID & Extra % */}
                            <td className="py-3.5 px-4">
                              <div className="font-mono text-xs text-slate-700 truncate max-w-[140px]">
                                {user.upiId || 'Default UPI'}
                              </div>
                              <div className="text-[10px] text-slate-500 font-bold">
                                {user.isExtraEnabled !== false
                                  ? `+${user.extraPercentage ?? 2}% Surcharge`
                                  : '0% Surcharge'}
                              </div>
                            </td>

                            {/* Validity Plan & Days */}
                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-slate-900 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{validityInfo.planLabel}</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {validityInfo.isLifetime
                                  ? 'Permanent'
                                  : `${validityInfo.formattedExpiry} (${validityInfo.daysRemaining}d left)`}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              {user.status === 'active' && !validityInfo.isExpired && (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Active</span>
                                </span>
                              )}
                              {user.status === 'active' && validityInfo.isExpired && (
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-300 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  <span>Expired</span>
                                </span>
                              )}
                              {user.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pending</span>
                                </span>
                              )}
                              {user.status === 'rejected' && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                                  <XCircle className="w-3 h-3 text-slate-500" />
                                  <span>Rejected</span>
                                </span>
                              )}
                            </td>

                            {/* Action Button */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {user.status === 'pending' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateStatus(user.id, 'active', user.validityPlan || '1_month');
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap animate-pulse hover:animate-none"
                                      title="Approve & Activate Customer Account"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Activate</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateStatus(user.id, 'rejected');
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs rounded-xl transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                      title="Reject Customer Registration"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Reject</span>
                                    </button>
                                  </>
                                )}
                                {user.status === 'active' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(user.id, 'rejected');
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-extrabold text-xs rounded-xl transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                    title="Reject or Suspend Customer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                )}
                                {user.status === 'rejected' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(user.id, 'active', user.validityPlan || '1_month');
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-extrabold text-xs rounded-xl transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                    title="Re-Activate Customer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Re-Activate</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartChangePassword(user);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                  title="Change User Password"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                                  <span className="hidden xl:inline">Password</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCustomer(user.id);
                                  }}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all active:scale-95 cursor-pointer"
                                  title="Delete Customer Permanently"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCustomer(user);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                  title="Open full customer details"
                                >
                                  <span>Details</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* MOBILE ONE-PAGE COMPACT DIRECTORY LIST */}
            <div className="md:hidden space-y-2.5">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-5">
                  <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-extrabold text-slate-700">No customers found</p>
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const validityInfo = getUserValidityInfo(user);

                  return (
                    <div
                      key={user.id}
                      onClick={() => setSelectedCustomer(user)}
                      className={`bg-white rounded-2xl border p-3.5 shadow-2xs cursor-pointer transition-all active:scale-[0.99] ${
                        user.status === 'pending'
                          ? 'border-amber-300 bg-amber-50/20'
                          : validityInfo.isExpired
                          ? 'border-rose-300 bg-rose-50/20'
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-sm flex items-center justify-center shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-xs truncate">
                              {user.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">
                              {user.businessName || user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {user.status === 'active' && !validityInfo.isExpired && (
                            <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                              Valid ({validityInfo.planLabel})
                            </span>
                          )}
                          {user.status === 'active' && validityInfo.isExpired && (
                            <span className="text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                              Expired
                            </span>
                          )}
                          {user.status === 'pending' && (
                            <span className="text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse">
                              Pending
                            </span>
                          )}
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span>ID: <span className="font-mono text-slate-700">{user.email}</span></span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {user.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(user.id, 'active', user.validityPlan || '1_month');
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs animate-pulse"
                                title="Approve & Activate Customer Account"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Activate</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(user.id, 'rejected');
                                }}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                title="Reject Registration"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                          {user.status === 'active' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(user.id, 'rejected');
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Reject Account"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          )}
                          {user.status === 'rejected' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(user.id, 'active', user.validityPlan || '1_month');
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Re-activate Account"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Re-Activate</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartChangePassword(user);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Change User Password"
                          >
                            <KeyRound className="w-3 h-3 text-slate-600" />
                            <span>Pass</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomer(user.id);
                            }}
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            title="Delete Customer Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-emerald-700 text-[11px]">Details ➔</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STORE & UPI CONFIG */}
        {activeTab === 'config' && (
          <form
            onSubmit={handleSaveForm}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Master Merchant & UPI Configuration</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set default receiving UPI address, business identity, surcharge percentage & voice alerts
                </p>
              </div>

              {saveSuccess && (
                <span className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>{syncStatus || 'Configuration Saved!'}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Store Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Store / Business Name
                </label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900"
                  placeholder="e.g. Sharma General Store"
                />
              </div>

              {/* UPI ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Receiving UPI ID / VPA
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900 font-mono"
                  placeholder="e.g. merchant@okhdfcbank"
                />
              </div>

              {/* Surcharge % */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Extra Surcharge Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={formData.extraPercentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        extraPercentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900"
                  />
                  <span className="absolute right-4 top-2.5 text-sm font-extrabold text-slate-400">
                    %
                  </span>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Default Payment Note
                </label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900"
                  placeholder="Bill Payment"
                />
              </div>
            </div>

            {/* Surcharge Switch Card */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <p className="text-xs font-extrabold text-slate-900">
                  Enable Extra Surcharge Rate
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Automatically add extra surcharge on POS counter bill amounts
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.isExtraEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, isExtraEnabled: e.target.checked })
                }
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Voice Soundbox Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    Indian Voice Soundbox Broadcast
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Real soundbox payment alert voice for instant cashier confirmation
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.soundboxVoice}
                  onChange={(e) =>
                    setFormData({ ...formData, soundboxVoice: e.target.checked })
                  }
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Voice Language:</span>
                  <div className="inline-flex rounded-xl p-1 bg-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, language: 'en' })}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        formData.language === 'en'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, language: 'hi' })}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        formData.language === 'hi'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Hindi
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestVoice}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Test Soundbox Voice</span>
                </button>
              </div>
            </div>

            {/* Form Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: SUPABASE CLOUD DATABASE */}
        {activeTab === 'database' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Supabase PostgreSQL Cloud Integration
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Project ID: {SUPABASE_PROJECT_ID}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-full text-emerald-800 text-xs font-extrabold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected & Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Cloud REST API Endpoint
                </span>
                <p className="text-xs font-mono text-slate-800 truncate font-semibold">
                  https://{SUPABASE_PROJECT_ID}.supabase.co
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Ping Latency
                </span>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono font-black text-emerald-700">
                    {pingLatency !== null ? `${pingLatency} ms` : 'Testing...'}
                  </p>
                  <button
                    type="button"
                    onClick={handleTestPing}
                    disabled={isPinging}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>Test Latency</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cloud Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={async () => {
                  setCloudSyncing(true);
                  const ok = await saveMerchantConfigToCloud(formData);
                  setCloudSyncing(false);
                  setSyncStatus(ok ? 'Synced to Supabase!' : 'Sync failed');
                  setTimeout(() => setSyncStatus(null), 2500);
                }}
                disabled={cloudSyncing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {cloudSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                <span>{cloudSyncing ? 'Syncing...' : 'Force Sync Config to Supabase'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs transition-all cursor-pointer"
              >
                {copiedSql ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
                <span>{copiedSql ? 'SQL Schema Copied!' : 'Copy SQL Table Schema'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSql}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-extrabold text-xs transition-all cursor-pointer border border-slate-300 shadow-2xs"
                title="Download .sql database migration script"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Download .sql File</span>
              </button>

              {syncStatus && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  {syncStatus}
                </span>
              )}
            </div>

            {/* SQL Terminal Box */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto shadow-inner">
              <div className="flex items-center justify-between text-slate-500 font-bold mb-2 pb-2 border-b border-slate-800">
                <span>-- Supabase & Cloud SQL PostgreSQL Migration Script</span>
                <span className="text-[10px] text-emerald-400">PostgreSQL</span>
              </div>
              <pre className="text-emerald-400 leading-relaxed whitespace-pre font-mono text-[11px]">
{FULL_DATABASE_SQL}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 4: PRESET CHIPS */}
        {activeTab === 'presets' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Cashier Quick-Add Amount Chips</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                These shortcut buttons appear under the bill amount on the counter for instant 1-tap calculation
              </p>
            </div>

            {/* Add New Preset */}
            <div className="flex items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <span className="absolute left-4 top-2.5 text-sm font-black text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  value={newPresetVal}
                  onChange={(e) => setNewPresetVal(e.target.value)}
                  placeholder="Enter amount (e.g. 1500)"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPreset}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Chip</span>
              </button>
            </div>

            {/* Existing Chips List */}
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-600 mb-3">Active Preset Chips on Counter:</p>
              <div className="flex flex-wrap gap-2.5">
                {presets.map((amount) => (
                  <div
                    key={amount}
                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-xl text-slate-900 font-black text-sm shadow-2xs transition-all"
                  >
                    <span>+₹{amount}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePreset(amount)}
                      title={`Remove ₹${amount}`}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Register New Customer */}
        {showAddCustomerModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl max-w-lg w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Register Customer Account
                    </h3>
                    <p className="text-xs text-slate-500">
                      Directly provision and validate customer login access
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {addError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                  {addError}
                </div>
              )}

              {addSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                  {addSuccess}
                </div>
              )}

              <form onSubmit={handleAdminAddCustomer} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Login Email / User ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      placeholder="e.g. ramesh@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="text"
                      required
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Phone
                    </label>
                    <input
                      type="text"
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Store / Business Name
                    </label>
                    <input
                      type="text"
                      value={addStore}
                      onChange={(e) => setAddStore(e.target.value)}
                      placeholder="e.g. Ramesh General Store"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Validation Status *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddStatus('active')}
                      className={`p-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                        addStatus === 'active'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-300'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      🟢 Valid (Immediate Access)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddStatus('pending')}
                      className={`p-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                        addStatus === 'pending'
                          ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-300'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      🟡 Pending Validation
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Customer Validity Duration *
                    </label>
                    <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      1M, 3M, 6M, 1Y Plans
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {VALIDITY_PLANS.filter((p) => p.id !== 'lifetime').map((plan) => {
                      const isSelected = addValidityPlan === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setAddValidityPlan(plan.id)}
                          className={`p-2.5 rounded-xl text-xs font-black border text-center transition-all cursor-pointer shadow-2xs ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <div>{plan.label}</div>
                          <div
                            className={`text-[10px] font-medium ${
                              isSelected ? 'text-emerald-100' : 'text-slate-400'
                            }`}
                          >
                            {plan.days} days
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    Register & Activate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CUSTOMER FULL DATA DETAILS (TRIGGERED ON ROW CLICK / FULL DETAILS BUTTON) */}
        {selectedCustomer && (() => {
          const validityInfo = getUserValidityInfo(selectedCustomer);
          const isCopiedAll = copiedCustomerId === selectedCustomer.id;

          return (
            <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between gap-3 border-b border-slate-700/60 shrink-0">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-lg text-white tracking-tight">
                          {selectedCustomer.name}
                        </h3>
                        {selectedCustomer.role === 'admin' && (
                          <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/40 font-black px-2 py-0.5 rounded-full">
                            ADMIN ACCOUNT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-2">
                        <span>{selectedCustomer.businessName || 'Merchant Store'}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-300">{selectedCustomer.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Badge in Header */}
                    {selectedCustomer.status === 'active' && !validityInfo.isExpired && (
                      <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Active ({validityInfo.planLabel})</span>
                      </span>
                    )}
                    {selectedCustomer.status === 'active' && validityInfo.isExpired && (
                      <span className="hidden sm:inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-black px-3 py-1 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Expired</span>
                      </span>
                    )}
                    {selectedCustomer.status === 'pending' && (
                      <span className="hidden sm:inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-black px-3 py-1 rounded-full animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pending</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
                  {/* WhatsApp Quick Share Action */}
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-emerald-950 flex items-center gap-2 text-sm">
                        <Share2 className="w-4 h-4 text-emerald-700" />
                        <span>WhatsApp Ready Credentials</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        1-Click copy formatted login details to send directly to customer on WhatsApp.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCustomerCredentials(selectedCustomer)}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer ${
                        isCopiedAll
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isCopiedAll ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy WhatsApp Message</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Section 1: Credentials & Access Console */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                      <span>Login Credentials & Authentication</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Login Email / ID */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Login ID / Email:
                        </span>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="font-mono font-black text-slate-900 text-sm truncate">
                            {selectedCustomer.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyField(selectedCustomer.email, 'modal_email')}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer transition-colors"
                            title="Copy Login ID"
                          >
                            {copiedModalField === 'modal_email' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            Customer Password:
                          </span>
                          <span className="text-[9px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            Admin Only Change
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1.5">
                          <span className="font-mono font-black text-slate-900 text-sm tracking-wider">
                            {modalPasswordVisible ? selectedCustomer.password : '••••••••••••'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setModalPasswordVisible(!modalPasswordVisible)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer transition-colors"
                              title={modalPasswordVisible ? 'Hide Password' : 'Show Password'}
                            >
                              {modalPasswordVisible ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyField(selectedCustomer.password, 'modal_pass')}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer transition-colors"
                              title="Copy Password"
                            >
                              {copiedModalField === 'modal_pass' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartChangePassword(selectedCustomer)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Change this customer's password (Admin Only)"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Change</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Profile & Account Information */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-600" />
                      <span>Customer & Business Profile</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block">Customer Name</span>
                        <span className="font-extrabold text-slate-900 block mt-0.5 truncate">
                          {selectedCustomer.name}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block">Store / Business</span>
                        <span className="font-extrabold text-slate-900 block mt-0.5 truncate">
                          {selectedCustomer.businessName || 'Merchant Store'}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block">Mobile Phone</span>
                        <span className="font-mono font-extrabold text-slate-900 block mt-0.5 truncate">
                          {selectedCustomer.phone || 'Not Provided'}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block">Registered On</span>
                        <span className="font-bold text-slate-800 block mt-0.5">
                          {new Date(selectedCustomer.registeredAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Merchant Payment & Terminal Settings */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                      <span>Assigned UPI & Terminal Configuration</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block">Receiving UPI ID</span>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <span className="font-mono font-black text-slate-900 truncate">
                            {selectedCustomer.upiId || 'sharmastore@okhdfcbank'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyField(selectedCustomer.upiId || 'sharmastore@okhdfcbank', 'modal_upi')}
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Copy UPI ID"
                          >
                            {copiedModalField === 'modal_upi' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block">Auto Surcharge Rate</span>
                        <span className="font-extrabold text-slate-900 block mt-0.5">
                          {selectedCustomer.isExtraEnabled !== false
                            ? `+${selectedCustomer.extraPercentage ?? 2}% Extra Added`
                            : 'Disabled (0%)'}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block">Voice Soundbox Alerts</span>
                        <span className="font-extrabold text-emerald-700 block mt-0.5 flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5" />
                          Active & Enabled
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Customer Validity Duration & Instant Extensions */}
                  <div className="bg-gradient-to-br from-emerald-50/60 to-slate-50 rounded-2xl p-4 border border-emerald-200/90 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <h4 className="text-[11px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                          <CalendarCheck className="w-4 h-4 text-emerald-700" />
                          <span>Customer Validity & Subscription Duration</span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Control how long this customer can login and operate their soundbox terminal.
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-600 text-white shadow-xs inline-block">
                          Plan: {validityInfo.planLabel}
                        </span>
                        <div className="text-[11px] text-slate-600 font-bold mt-1">
                          {validityInfo.isLifetime
                            ? 'Permanent (Never Expires)'
                            : validityInfo.isExpired
                            ? `Expired on ${validityInfo.formattedExpiry}`
                            : `Expires on ${validityInfo.formattedExpiry} (${validityInfo.daysRemaining} days left)`}
                        </div>
                      </div>
                    </div>

                    {/* 1-Click Validity Duration Extension Buttons */}
                    <div className="pt-2 border-t border-emerald-200/60">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-2">
                        1-Click Instant Duration Setting:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {VALIDITY_PLANS.map((plan) => {
                          const isCurrent =
                            selectedCustomer.validityPlan === plan.id &&
                            !validityInfo.isExpired &&
                            selectedCustomer.status === 'active';

                          return (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() =>
                                handleSetCustomerValidity(
                                  selectedCustomer.id,
                                  plan.id,
                                  selectedCustomer.name
                                )
                              }
                              className={`p-2.5 rounded-xl text-xs font-black border text-center transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                isCurrent
                                  ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300'
                                  : 'bg-white hover:bg-emerald-50 text-slate-800 border-slate-200'
                              }`}
                              title={`Set validity to ${plan.label}`}
                            >
                              <div>{plan.label}</div>
                              <div
                                className={`text-[10px] font-semibold ${
                                  isCurrent ? 'text-emerald-100' : 'text-slate-400'
                                }`}
                              >
                                {plan.id === 'lifetime' ? 'Unlimited' : `${plan.days} Days`}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Account Status Management */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      Account Status Controls
                    </h4>

                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedCustomer.status !== 'active' ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-extrabold text-slate-600">
                              Approve with:
                            </span>
                            {(['1_month', '3_months', '1_year'] as ValidityPlan[]).map((planOption) => (
                              <button
                                key={planOption}
                                type="button"
                                onClick={() =>
                                  handleUpdateStatus(selectedCustomer.id, 'active', planOption)
                                }
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{planOption === '1_month' ? '1 Month' : planOption === '3_months' ? '3 Months' : '1 Year'}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(selectedCustomer.id, 'pending')}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Mark Pending</span>
                          </button>
                        )}

                        {selectedCustomer.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(selectedCustomer.id, 'rejected')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject Customer</span>
                          </button>
                        )}

                        {selectedCustomer.status === 'rejected' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(
                                selectedCustomer.id,
                                'active',
                                selectedCustomer.validityPlan || '1_month'
                              )
                            }
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Re-Activate Customer</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                        title="Delete customer permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Customer</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ADMIN-ONLY CHANGE PASSWORD MODAL */}
        {editingPasswordUser && (
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-bold">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Change User Password</h3>
                    <p className="text-[11px] text-emerald-400 font-bold">Admin Exclusive Authority</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPasswordUser(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveChangedPassword} className="p-5 space-y-4 text-xs">
                {/* User Card info */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                    {editingPasswordUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 text-sm truncate">{editingPasswordUser.name}</p>
                    <p className="text-slate-500 font-mono text-[11px] truncate">{editingPasswordUser.email}</p>
                    <p className="text-slate-500 text-[10px] truncate">{editingPasswordUser.businessName || 'Merchant Store'}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md shrink-0">
                    {editingPasswordUser.role}
                  </span>
                </div>

                {/* Security Rule Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                    <strong>Admin Security Rule:</strong> Normal users cannot change their passwords. Only the <strong>Admin</strong> has exclusive permission to set or reset this account password.
                  </p>
                </div>

                {/* Current Password Display */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Current Password:
                    </span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {editingPasswordUser.password}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyField(editingPasswordUser.password, 'curr_pass')}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-[10px] hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedModalField === 'curr_pass' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy</span>
                  </button>
                </div>

                {/* New Password Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPasswordInput}
                      onChange={(e) => {
                        setNewPasswordInput(e.target.value);
                        setPasswordChangeError(null);
                      }}
                      placeholder="Enter new password (min 3 characters)"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-mono font-bold text-slate-900"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Quick Generators */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleGeneratePinPassword}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-[11px] text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Generate 6-Digit PIN</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateStrongPassword}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-[11px] text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3 text-emerald-600" />
                      <span>Generate Strong Pass</span>
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {passwordChangeError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordChangeError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {passwordChangeSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{passwordChangeSuccess}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingPasswordUser(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save New Password</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CUSTOMER DELETE CONFIRMATION MODAL */}
        {customerToDelete && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden">
              <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Delete Customer Account</h3>
                    <p className="text-[11px] font-semibold text-rose-700">Permanent Removal</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomerToDelete(null)}
                  className="w-7 h-7 rounded-lg bg-rose-100/70 hover:bg-rose-200 text-rose-700 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-700 leading-relaxed">
                  Are you sure you want to permanently delete customer{' '}
                  <strong className="text-slate-900 font-black">
                    {customerToDelete.name || customerToDelete.email}
                  </strong>{' '}
                  (<span className="font-mono text-slate-600">{customerToDelete.email}</span>)?
                </p>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Warning:</strong> This will delete their account credentials, validity, and access immediately. This action cannot be undone.
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCustomerToDelete(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteCustomer}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs cursor-pointer shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Customer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
