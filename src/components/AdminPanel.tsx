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
} from '../lib/userStore';

interface AdminPanelProps {
  config: MerchantConfig;
  onSaveConfig: (newConfig: MerchantConfig) => void;
  onSwitchToTerminal: () => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  config,
  onSaveConfig,
  onSwitchToTerminal,
  onLogout,
}) => {
  const [formData, setFormData] = useState<MerchantConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<'config' | 'database' | 'presets' | 'roles'>('config');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Customer Registrations & Notification state
  const [usersList, setUsersList] = useState<RegisteredUser[]>(() => getRegisteredUsers());
  const [unreadNotifications, setUnreadNotifications] = useState<number>(() => getUnreadRegistrationCount());
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'pending' | 'active' | 'expired' | 'rejected'>('all');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [validityToast, setValidityToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

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
    setSyncStatus(cloudOk ? 'Synced to Supabase Cloud!' : 'Saved locally');

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

  const handleCopySql = () => {
    const sql = `-- Supabase Table Schema for Merchant QR Config
create table if not exists merchant_config (
  id text primary key,
  store_name text,
  upi_id text,
  extra_percentage numeric,
  is_extra_enabled boolean,
  currency text,
  note text,
  soundbox_voice boolean,
  language text,
  updated_at timestamptz default now()
);

-- Row Level Security & Public policy
alter table merchant_config enable row level security;
create policy "Allow all access to merchant_config" on merchant_config for all using (true) with check (true);
`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleTestVoice = () => {
    announceSoundbox(102, formData.language, formData.storeName);
  };

  const refreshUsersData = () => {
    const list = getRegisteredUsers();
    setUsersList(list);
    setUnreadNotifications(getUnreadRegistrationCount());
  };

  const handleUpdateStatus = (
    userId: string,
    newStatus: 'active' | 'pending' | 'rejected',
    plan: ValidityPlan = '1_month'
  ) => {
    updateUserStatus(userId, newStatus, plan);
    refreshUsersData();
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
        message: `${userName} set to Valid (${planLabel})! Expiry: ${validityInfo?.formattedExpiry || ''}`,
        type: 'success',
      });
      setTimeout(() => {
        setValidityToast(null);
      }, 4000);
    }
  };

  const handleDeleteCustomer = (userId: string) => {
    deleteRegisteredUser(userId);
    refreshUsersData();
  };

  const handleTogglePassword = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
      `Customer ${addName} registered successfully (${addStatus === 'active' ? `Valid - ${planItem?.label}` : 'Pending Validation'})!`
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

  // Filtered customer list
  const filteredUsers = usersList.filter((u) => {
    if (u.email === 'demo11') return false; // Admin kept separate

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
    <div className="min-h-screen bg-[#f0f5f3] flex flex-col items-center py-5 px-3 sm:px-6 selection:bg-emerald-200">
      <div className="w-full max-w-2xl space-y-4">
        {/* Top Navbar */}
        <div className="bg-white rounded-2xl border-2 border-emerald-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-emerald-400 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-slate-900 leading-tight">
                  Admin Control Panel
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  Administrator
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Customer registrations, UPI terminal & Supabase database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                id="btn-admin-notifications"
                type="button"
                onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                className={`relative p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  unreadNotifications > 0
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="Customer Registration Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotificationsMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border-2 border-slate-200 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900">
                      <Bell className="w-4 h-4 text-emerald-600" />
                      <span>Registration Notifications</span>
                      {unreadNotifications > 0 && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full">
                          {unreadNotifications} New
                        </span>
                      )}
                    </div>
                    {unreadNotifications > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkNotificationsRead}
                        className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {usersList.filter((u) => u.email !== 'demo11').length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400">
                        No customer registrations yet.
                      </div>
                    ) : (
                      usersList
                        .filter((u) => u.email !== 'demo11')
                        .slice(0, 5)
                        .map((u) => (
                          <div
                            key={u.id}
                            className={`p-2.5 rounded-xl border text-xs transition-colors ${
                              !u.isNotificationRead
                                ? 'bg-amber-50/60 border-amber-200'
                                : 'bg-slate-50 border-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900">
                                {u.name}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  u.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {u.status === 'active' ? 'Valid' : 'Pending'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                              <span>{u.email}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(u.registeredAt).toLocaleDateString()}
                              </span>
                            </div>
                            {u.status !== 'active' && (
                              <div className="mt-2 pt-1.5 border-t border-amber-200/60">
                                <span className="block text-[10px] font-bold text-amber-900 mb-1">
                                  Make Valid with Duration:
                                </span>
                                <div className="grid grid-cols-4 gap-1">
                                  {(['1_month', '3_months', '6_months', '1_year'] as ValidityPlan[]).map((planKey) => {
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
                                        className="py-1 px-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg text-center cursor-pointer shadow-2xs transition-all active:scale-95"
                                        title={`Validate for ${labels[planKey]}`}
                                      >
                                        +{labels[planKey]}
                                      </button>
                                    );
                                  })}
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
                    className="mt-3 w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition-colors cursor-pointer"
                  >
                    View All Registrations &rarr;
                  </button>
                </div>
              )}
            </div>

            <button
              id="btn-switch-to-terminal"
              type="button"
              onClick={onSwitchToTerminal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Open Terminal</span>
            </button>

            <button
              id="btn-admin-logout"
              type="button"
              onClick={onLogout}
              title="Logout from Admin"
              className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick System Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <span>Cloud Status</span>
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-extrabold text-sm text-slate-900">Supabase</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                {pingLatency ? `${pingLatency}ms` : 'Ready'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <span>Surcharge</span>
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1">
              <span className="font-extrabold text-sm text-slate-900">
                {config.isExtraEnabled ? `+${config.extraPercentage}% Extra` : 'Disabled'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <span>Soundbox</span>
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1">
              <span className="font-extrabold text-sm text-slate-900">
                {config.soundboxVoice ? `${config.language.toUpperCase()} Voice` : 'Off'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <span>Admin Role</span>
              <Users className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1">
              <span className="font-extrabold text-sm text-emerald-700">
                Master Admin
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white rounded-xl px-2 py-1.5 shadow-2xs gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Store & UPI Config</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'database'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Cloud</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Preset Chips</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers & Roles</span>
            {unreadNotifications > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ml-0.5 animate-pulse">
                {unreadNotifications}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Store & UPI Config */}
        {activeTab === 'config' && (
          <form
            onSubmit={handleSaveForm}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Primary Merchant Settings</span>
              </h2>
              {saveSuccess && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>{syncStatus || 'Saved successfully!'}</span>
                </span>
              )}
            </div>

            {/* Store Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Store / Business Name
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900"
                placeholder="e.g., Sharma General Store"
              />
            </div>

            {/* UPI ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                UPI ID / VPA (Receiving UPI Address)
              </label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900 font-mono"
                placeholder="e.g., merchant@okhdfcbank"
              />
            </div>

            {/* Surcharge % & Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900"
                  />
                  <span className="absolute right-3.5 top-2.5 text-sm font-bold text-slate-400">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Payment Note
                </label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900"
                  placeholder="Bill Payment"
                />
              </div>
            </div>

            {/* Surcharge switch */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="text-xs font-bold text-slate-800">Enable Surcharge Calculation</p>
                <p className="text-[11px] text-slate-500">
                  Automatically add extra % on bill amounts on counter
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

            {/* Soundbox Voice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Voice Soundbox Alert</p>
                  <p className="text-[11px] text-slate-500">
                    Smart Indian voice audio broadcast on payments
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

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Voice Language:</span>
                  <div className="inline-flex rounded-lg p-0.5 bg-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, language: 'en' })}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
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
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
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
                  className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg active:scale-95 transition-all cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Test Voice</span>
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save All Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Supabase Cloud Database */}
        {activeTab === 'database' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Supabase PostgreSQL Cloud
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Project ID: {SUPABASE_PROJECT_ID}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-full text-emerald-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Target Supabase Endpoint
                </span>
                <p className="text-xs font-mono text-slate-800 truncate">
                  https://{SUPABASE_PROJECT_ID}.supabase.co
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Ping Response Time
                </span>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono font-bold text-emerald-700">
                    {pingLatency !== null ? `${pingLatency} ms` : 'Not tested'}
                  </p>
                  <button
                    type="button"
                    onClick={handleTestPing}
                    disabled={isPinging}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>Ping Test</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                {cloudSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
                <span>{cloudSyncing ? 'Syncing...' : 'Force Sync Config to Cloud'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-slate-100 font-bold text-xs transition-all cursor-pointer"
              >
                {copiedSql ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{copiedSql ? 'SQL Schema Copied!' : 'Copy SQL Table Schema'}</span>
              </button>

              {syncStatus && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                  {syncStatus}
                </span>
              )}
            </div>

            {/* SQL Preview Box */}
            <div className="mt-3 bg-slate-900 rounded-xl p-3.5 border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto">
              <span className="text-slate-500 font-bold block mb-1">
                -- PostgreSQL Table Definition in Supabase
              </span>
              <pre className="text-emerald-400">
{`CREATE TABLE merchant_config (
  id TEXT PRIMARY KEY,
  store_name TEXT,
  upi_id TEXT,
  extra_percentage NUMERIC,
  is_extra_enabled BOOLEAN,
  currency TEXT,
  note TEXT,
  soundbox_voice BOOLEAN,
  language TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Preset Fast Amount Chips */}
        {activeTab === 'presets' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Cashier Quick-Add Amount Chips</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                These buttons appear under the bill amount input for fast 1-tap calculation
              </p>
            </div>

            {/* Add New Preset */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  value={newPresetVal}
                  onChange={(e) => setNewPresetVal(e.target.value)}
                  placeholder="Enter amount (e.g. 1500)"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPreset}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Chip</span>
              </button>
            </div>

            {/* Existing Chips List */}
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-600 mb-2">Active Preset Chips:</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((amount) => (
                  <div
                    key={amount}
                    className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl text-slate-800 font-extrabold text-sm shadow-2xs"
                  >
                    <span>+₹{amount}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePreset(amount)}
                      title={`Remove ₹${amount}`}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Customer Registrations & Validation Management */}
        {activeTab === 'roles' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            {/* Header with Title & Register Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Customer Registrations & Admin Validation</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  View, validate, approve, or register customer accounts with login email & password
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Register New Customer</span>
              </button>
            </div>

            {/* Validity Toast Notification */}
            {validityToast && (
              <div className="p-3.5 rounded-xl bg-emerald-600 text-white shadow-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                  <span>{validityToast.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setValidityToast(null)}
                  className="text-emerald-200 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Pending Validation Alert Banner */}
            {usersList.some((u) => u.email !== 'demo11' && u.status === 'pending') && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>New Customer Registrations Pending!</strong> Choose validity plan to approve and activate customer login.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[11px] font-bold text-amber-900">
                    Approve All Pending For:
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
                            .filter((u) => u.email !== 'demo11' && u.status === 'pending')
                            .forEach((u) => {
                              updateUserStatus(u.id, 'active', pKey);
                            });
                          markAllNotificationsRead();
                          refreshUsersData();
                          setValidityToast({
                            message: `All pending customers approved with ${labelMap[pKey]} validity!`,
                            type: 'success',
                          });
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg active:scale-95 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{labelMap[pKey]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Total Customers</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {usersList.filter((u) => u.email !== 'demo11').length}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-[11px] font-bold text-emerald-800 uppercase">Valid Active</div>
                <div className="text-lg font-black text-emerald-700 mt-0.5">
                  {
                    usersList.filter(
                      (u) =>
                        u.email !== 'demo11' &&
                        u.status === 'active' &&
                        !getUserValidityInfo(u).isExpired
                    ).length
                  }
                </div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                <div className="text-[11px] font-bold text-rose-800 uppercase">Expired / Due</div>
                <div className="text-lg font-black text-rose-700 mt-0.5">
                  {
                    usersList.filter(
                      (u) =>
                        u.email !== 'demo11' &&
                        getUserValidityInfo(u).isExpired
                    ).length
                  }
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="text-[11px] font-bold text-amber-800 uppercase">Pending Approval</div>
                <div className="text-lg font-black text-amber-700 mt-0.5">
                  {usersList.filter((u) => u.email !== 'demo11' && u.status === 'pending').length}
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search customer name, email, mobile, store..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {(['all', 'active', 'expired', 'pending', 'rejected'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setUserStatusFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                        userStatusFilter === filter
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter === 'all'
                        ? 'All'
                        : filter === 'active'
                        ? 'Valid (Active)'
                        : filter === 'expired'
                        ? 'Expired'
                        : filter === 'pending'
                        ? 'Pending'
                        : 'Rejected'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer List */}
            <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <User className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-600">No customers found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Customers registering on the portal will appear here for admin validity management
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isPassVisible = revealedPasswords[user.id] || false;
                  const validityInfo = getUserValidityInfo(user);

                  return (
                    <div
                      key={user.id}
                      className={`p-4 rounded-xl border transition-all ${
                        user.status === 'pending'
                          ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200'
                          : validityInfo.isExpired
                          ? 'bg-rose-50/40 border-rose-300'
                          : user.status === 'active'
                          ? 'bg-white border-slate-200 shadow-2xs hover:border-emerald-300'
                          : 'bg-slate-50/60 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-extrabold text-slate-900">
                                {user.name}
                              </h3>
                              {user.businessName && (
                                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {user.businessName}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Registered: {new Date(user.registeredAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status & Validity Badge */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {user.status === 'active' && !validityInfo.isExpired && (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Valid ({validityInfo.planLabel})</span>
                            </span>
                          )}

                          {user.status === 'active' && validityInfo.isExpired && (
                            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>Validity Expired</span>
                            </span>
                          )}

                          {user.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Validation</span>
                            </span>
                          )}

                          {user.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3 text-slate-500" />
                              <span>Rejected</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Customer Credentials (Email & Password) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2.5 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Login Email / Username:
                          </span>
                          <span className="text-slate-900 font-bold font-mono truncate block">
                            {user.email}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                          <div className="overflow-hidden mr-2">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              Password:
                            </span>
                            <span className="text-slate-900 font-bold font-mono truncate block">
                              {isPassVisible ? user.password : '••••••••'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTogglePassword(user.id)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                            title={isPassVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isPassVisible ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Mobile / Phone:
                          </span>
                          <span className="text-slate-900 font-bold font-mono">
                            {user.phone || 'Not provided'}
                          </span>
                        </div>
                      </div>

                      {/* Customer Validity & Subscription Period Box */}
                      <div className="my-2 p-2.5 rounded-xl bg-gradient-to-r from-emerald-50/60 via-slate-50 to-teal-50/60 border border-emerald-200">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                          <div className="flex items-center gap-1.5">
                            <CalendarClock className="w-4 h-4 text-emerald-700" />
                            <span className="text-xs font-extrabold text-slate-800">
                              Validity Status:
                            </span>
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-900 shadow-2xs">
                              {validityInfo.planLabel}
                            </span>
                          </div>

                          <div className="text-[11px] font-bold">
                            {validityInfo.isLifetime ? (
                              <span className="text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                                Permanent Access
                              </span>
                            ) : validityInfo.isExpired ? (
                              <span className="text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                Expired on {validityInfo.formattedExpiry} (Login Locked)
                              </span>
                            ) : (
                              <span className="text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                                <CalendarCheck className="w-3 h-3 text-emerald-600" />
                                Valid Until: {validityInfo.formattedExpiry} ({validityInfo.daysRemaining} days left)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 1-Click Validity Assignment: 1 Month, 3 Months, 6 Months, 1 Year */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-emerald-100">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mr-1">
                            Set / Extend Validity:
                          </span>
                          {VALIDITY_PLANS.filter((p) => p.id !== 'lifetime').map((plan) => {
                            const isCurrentPlan = user.validityPlan === plan.id && !validityInfo.isExpired && user.status === 'active';
                            return (
                              <button
                                key={plan.id}
                                type="button"
                                onClick={() => handleSetCustomerValidity(user.id, plan.id, user.name)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95 ${
                                  isCurrentPlan
                                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                                    : 'bg-white hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200'
                                }`}
                                title={`Set customer validity to ${plan.label} (${plan.days} days)`}
                              >
                                <span>{plan.label}</span>
                                {isCurrentPlan && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Admin Validation Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {user.status !== 'active' ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] font-extrabold text-slate-600 uppercase">
                                Approve With:
                              </span>
                              {(['1_month', '3_months', '6_months', '1_year'] as ValidityPlan[]).map((planOption) => {
                                const names: Record<string, string> = {
                                  '1_month': '1 Month',
                                  '3_months': '3 Months',
                                  '6_months': '6 Months',
                                  '1_year': '1 Year',
                                };
                                return (
                                  <button
                                    key={planOption}
                                    type="button"
                                    onClick={() => handleUpdateStatus(user.id, 'active', planOption)}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg active:scale-95 transition-all cursor-pointer shadow-2xs"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{names[planOption]}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(user.id, 'pending')}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-lg transition-all cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Mark Pending</span>
                            </button>
                          )}

                          {user.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(user.id, 'rejected')}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-bold text-xs rounded-lg transition-all cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(user.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="Delete customer record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Modal: Register New Customer from Admin Panel */}
        {showAddCustomerModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl border-2 border-emerald-200 p-5 shadow-2xl max-w-md w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Register New Customer (Admin Option)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Directly create and validate customer login
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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

              <form onSubmit={handleAdminAddCustomer} className="space-y-3">
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email / Login Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="e.g. ramesh@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
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
                    placeholder="Enter customer password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Phone
                    </label>
                    <input
                      type="text"
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
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
                      placeholder="e.g. Ramesh Store"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin Validation Status *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddStatus('active')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        addStatus === 'active'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-400'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      🟢 Valid / Active (Immediate Access)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddStatus('pending')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        addStatus === 'pending'
                          ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-400'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      🟡 Pending Validation
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Customer Validity Plan *
                    </label>
                    <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      1M, 3M, 6M, 1Y
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {VALIDITY_PLANS.filter((p) => p.id !== 'lifetime').map((plan) => {
                      const isSelected = addValidityPlan === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setAddValidityPlan(plan.id)}
                          className={`p-2 rounded-xl text-xs font-black border text-center transition-all cursor-pointer shadow-2xs ${
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

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    Register & Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
