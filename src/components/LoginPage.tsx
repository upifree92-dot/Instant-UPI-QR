import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  QrCode,
  AlertCircle,
  UserCheck,
  UserPlus,
  User,
  Phone,
  Store,
  CheckCircle2,
  Check,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { UserRole, ValidityPlan } from '../types';
import {
  authenticateUser,
  registerCustomer,
  syncWithServerUsers,
  subscribeToSuperAutoConnect,
} from '../lib/userStore';

const PACKAGES: {
  id: ValidityPlan;
  title: string;
  duration: string;
  price: number;
  originalPrice?: number;
  saveText?: string;
  tag?: string;
}[] = [
  { id: '1_month', title: '1 Month', duration: '30 Days', price: 500 },
  { id: '3_months', title: '3 Month', duration: '90 Days', price: 1299, originalPrice: 1500, saveText: 'Save ₹201' },
  { id: '6_months', title: '6 Month', duration: '180 Days', price: 2199, originalPrice: 3000, saveText: 'Save ₹801', tag: 'Popular' },
  { id: '1_year', title: '1 Year', duration: '365 Days', price: 2999, originalPrice: 6000, saveText: 'Save ₹3001', tag: 'Best Value' },
];

const SAVED_CREDENTIALS_KEY = 'upi_saved_login_credentials_v1';
const REMEMBER_PREF_KEY = 'upi_remember_login_pref_v1';

export const ADMIN_WHATSAPP_NUMBER = '918598912555';
export const ADMIN_WHATSAPP_DISPLAY = '8598912555';

export interface PendingActivationInfo {
  name: string;
  email: string;
  planTitle: string;
  planPrice: number;
  phone?: string;
  store?: string;
}

export function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function buildAdminWhatsAppUrl(info: {
  name: string;
  email: string;
  planTitle?: string;
  planPrice?: number;
  phone?: string;
  store?: string;
}): string {
  // Completely strip out "free" or "Free" from the customer name
  const cleanName =
    info.name
      .replace(/\bfree\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Upi';

  const lines = [
    `🔔 *NEW ACCOUNT ACTIVATION REQUEST*`,
    ``,
    `Hello Admin! I have registered a new account. Please activate my account.`,
    ``,
    `👤 *Customer Name:* ${cleanName}`,
    `📧 *Gmail / User ID:* ${info.email}`,
    info.planTitle ? `📦 *Selected Package:* ${info.planTitle} (₹${info.planPrice || 500})` : '',
    info.phone && info.phone.trim() ? `📱 *Phone Number:* ${info.phone.trim()}` : '',
    `🏪 *Store / Business:* ${info.store && info.store.trim() ? info.store.trim() : '...'}`,
  ].filter(Boolean);

  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

interface LoginPageProps {
  onLoginSuccess: (user: string, role: UserRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Remember / Save credentials state
  const [saveCredentials, setSaveCredentials] = useState<boolean>(() => {
    try {
      const pref = localStorage.getItem(REMEMBER_PREF_KEY);
      return pref === null ? true : pref === 'true';
    } catch {
      return true;
    }
  });

  const [hasSavedCredentials, setHasSavedCredentials] = useState<boolean>(false);

  // Login form state - initialized from saved credentials if present
  const [username, setUsername] = useState(() => {
    try {
      const raw = localStorage.getItem(SAVED_CREDENTIALS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.username || '';
      }
    } catch {}
    return '';
  });

  const [password, setPassword] = useState(() => {
    try {
      const raw = localStorage.getItem(SAVED_CREDENTIALS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.password || '';
      }
    } catch {}
    return '';
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_CREDENTIALS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.username && parsed.password) {
          setHasSavedCredentials(true);
        }
      }
    } catch {}
  }, []);

  const handleClearSavedCredentials = () => {
    try {
      localStorage.removeItem(SAVED_CREDENTIALS_KEY);
      setUsername('');
      setPassword('');
      setHasSavedCredentials(false);
      setSuccessMsg('Saved credentials cleared from this device.');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch {}
  };

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regStore, setRegStore] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<ValidityPlan>('1_month');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // UI status
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [pendingActivationInfo, setPendingActivationInfo] = useState<PendingActivationInfo | null>(null);

  // Super Automatic real-time auto-connect for registration and instant activation detection
  useEffect(() => {
    syncWithServerUsers().catch(() => {});

    const unsubscribe = subscribeToSuperAutoConnect((payload) => {
      if (payload.type === 'user_updated' && payload.user) {
        const targetEmail = (username || regEmail || pendingActivationInfo?.email || '').trim().toLowerCase();
        if (targetEmail && payload.user.email?.toLowerCase() === targetEmail) {
          if (payload.user.status === 'active') {
            setError(null);
            setSuccessMsg(`🎉 Super Connect: Account (${payload.user.email}) has been ACTIVATED by Admin! You can log in now.`);
            setMode('login');
            setUsername(payload.user.email);
            if (payload.user.password && !password) {
              setPassword(payload.user.password);
            }
          } else if (payload.user.status === 'rejected') {
            setError('Account registration was declined. WhatsApp: 8598912555');
          }
        }
      }
    });

    return () => unsubscribe();
  }, [username, regEmail, pendingActivationInfo?.email, password]);

  const handleCheckActivationStatus = async () => {
    const targetEmail = (username || regEmail || pendingActivationInfo?.email || '').trim().toLowerCase();
    if (!targetEmail) {
      setError('Please enter your User ID or Email to check status.');
      return;
    }

    setIsCheckingStatus(true);
    try {
      const syncedUsers = await syncWithServerUsers();
      const found = syncedUsers.find(
        (u) => u.email.toLowerCase() === targetEmail || (u.phone && u.phone === targetEmail)
      );

      if (found) {
        if (found.status === 'active') {
          setError(null);
          setSuccessMsg(`Great news! Your account (${found.email}) is ACTIVE! You can now log in.`);
          setMode('login');
          setUsername(found.email);
        } else if (found.status === 'rejected') {
          setError(`Account registration was declined. Please contact Admin on WhatsApp 8598912555.`);
        } else {
          setError(`Account (${found.email}) is still Pending Admin approval. Please contact Admin on WhatsApp 8598912555 for instant activation.`);
        }
      } else {
        setError(`No registration found for "${targetEmail}". Please register first.`);
      }
    } catch {
      setError('Unable to reach server. Please try again or WhatsApp Admin: 8598912555.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('Please enter both User ID / Email and password.');
      return;
    }

    setIsLoading(true);

    // Sync latest user list from server so admin activations are recognized immediately
    try {
      await syncWithServerUsers();
    } catch {}

    const auth = authenticateUser(trimmedUser, trimmedPass);
    setIsLoading(false);

    if (auth.success && auth.user) {
      // Save Name and Password if option is checked
      if (saveCredentials) {
        try {
          localStorage.setItem(
            SAVED_CREDENTIALS_KEY,
            JSON.stringify({ username: trimmedUser, password: trimmedPass })
          );
          localStorage.setItem(REMEMBER_PREF_KEY, 'true');
        } catch {}
      } else {
        try {
          localStorage.removeItem(SAVED_CREDENTIALS_KEY);
          localStorage.setItem(REMEMBER_PREF_KEY, 'false');
        } catch {}
      }

      onLoginSuccess(auth.user.email, auth.isAdmin ? 'admin' : auth.user.role);
    } else {
      setError(auth.error || 'Invalid username or password.');
      if (auth.error?.includes('pending') || auth.error?.includes('Activation')) {
        setPendingActivationInfo({
          name: 'Customer',
          email: trimmedUser,
          planTitle: 'Account Validity',
          planPrice: 500,
        });
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regEmail.trim()) {
      setError('Please enter your Username or Email ID.');
      return;
    }
    if (!regPassword || regPassword.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }

    setIsLoading(true);

    // Clean name derived from email/username or given name
    const rawDerived = regEmail.split('@')[0] || 'User';
    const sanitizedName =
      rawDerived.replace(/\bfree\b/gi, '').replace(/\s+/g, ' ').trim() || 'User';

    const reg = registerCustomer({
      name: sanitizedName,
      email: regEmail.trim(),
      password: regPassword,
      phone: regPhone.trim(),
      businessName: '',
      role: 'customer',
      status: 'pending',
      validityPlan: selectedPlan,
    });

    if (!reg.success) {
      setIsLoading(false);
      setError(reg.error || 'Registration failed.');
      return;
    }

    // Sync registration with server
    try {
      await syncWithServerUsers();
    } catch {}

    setIsLoading(false);

    const activePkg = PACKAGES.find((p) => p.id === selectedPlan) || PACKAGES[0];
    setPendingActivationInfo({
      name: sanitizedName,
      email: regEmail.trim(),
      planTitle: activePkg.title,
      planPrice: activePkg.price,
      phone: regPhone.trim(),
      store: '',
    });
    setSuccessMsg(
      `Registration Submitted! Account (${regEmail.trim()}) activation request has been sent to Admin Panel (${activePkg.title} • ₹${activePkg.price}). Once activated, you will be able to log in.`
    );

    // Prepopulate login form and switch to login tab
    setUsername(regEmail.trim());
    setPassword(regPassword);

    if (saveCredentials) {
      try {
        localStorage.setItem(
          SAVED_CREDENTIALS_KEY,
          JSON.stringify({ username: regEmail.trim(), password: regPassword })
        );
        setHasSavedCredentials(true);
      } catch {}
    }

    setMode('login');

    // Clear reg form
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegPhone('');
    setRegStore('');
  };

  return (
    <div className="min-h-screen bg-[#f0f5f3] flex flex-col items-center justify-center py-8 px-4 selection:bg-emerald-200">
      <div className="w-full max-w-md">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 flex items-center justify-center text-white shadow-xl shadow-emerald-950/20 mb-3 border border-emerald-500/30">
            <QrCode className="w-9 h-9 stroke-[2.2] text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              OmniPay Elite
            </h1>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-md shadow-2xs">
              PRO
            </span>
          </div>
          <p className="text-xs font-bold text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 px-3 py-1 rounded-full mt-2 inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Smart Enterprise Merchant POS Terminal</span>
          </p>
        </div>

        {/* Login/Register Card */}
        <div className="bg-white rounded-[26px] border-2 border-emerald-200/90 shadow-sm p-6 sm:p-7">
          {/* Top Tabs: Login vs Register */}
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-5">
            <button
              id="tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Login</span>
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold space-y-2.5 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>

              {(error.toLowerCase().includes('pending') || error.toLowerCase().includes('activation')) && (
                <div className="pt-1">
                  <a
                    href={buildAdminWhatsAppUrl(
                      pendingActivationInfo || {
                        name: 'Customer',
                        email: username || 'User',
                        planTitle: 'Account Validity',
                        planPrice: 500,
                      }
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 bg-[#25D366] hover:bg-[#1ebe5d] active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-white shrink-0" />
                    <span>Admin WhatsApp Activation: 8598912555</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white shrink-0" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Registration Success & WhatsApp Direct Action Card */}
          {successMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-b from-emerald-50 via-teal-50/40 to-white border-2 border-emerald-400 shadow-sm space-y-3.5 animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    Registration Submitted • Pending Activation
                  </h4>
                  <p className="text-xs font-medium text-emerald-950 mt-1 leading-relaxed">
                    {successMsg}
                  </p>
                </div>
              </div>

              {/* WhatsApp Notification Button for Admin 8598912555 */}
              <div className="pt-0.5">
                <a
                  href={buildAdminWhatsAppUrl(
                    pendingActivationInfo || {
                      name: 'Customer',
                      email: username || 'User',
                      planTitle: '1 Month',
                      planPrice: 500,
                    }
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-3.5 bg-[#25D366] hover:bg-[#1ebe5d] active:scale-[0.98] text-white font-black text-xs rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-between gap-2.5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <WhatsAppIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-black leading-tight truncate">
                        Admin ko WhatsApp par Message Bhejein
                      </div>
                      <div className="text-[10px] text-emerald-100 font-bold leading-tight mt-0.5 truncate">
                        WhatsApp: 8598912555 (1-Tap Activation Request)
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white shrink-0 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              {/* Check Activation Status Button */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={handleCheckActivationStatus}
                  disabled={isCheckingStatus}
                  className="w-full py-2.5 px-3 bg-white hover:bg-emerald-50 active:scale-[0.98] text-emerald-800 border border-emerald-300 font-extrabold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                  <span>{isCheckingStatus ? 'Checking with Admin Panel...' : 'Check Activation Status (Refresh)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Username / User ID */}
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  User ID / Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter email or username"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900 transition-colors placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900 transition-colors placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Save Name & Password (Remember Login) Option */}
              <div className="flex items-center justify-between pt-0.5 pb-1">
                <label
                  htmlFor="chk-save-credentials"
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none hover:text-emerald-700 transition-colors"
                >
                  <input
                    id="chk-save-credentials"
                    type="checkbox"
                    checked={saveCredentials}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setSaveCredentials(val);
                      try {
                        localStorage.setItem(REMEMBER_PREF_KEY, val ? 'true' : 'false');
                        if (!val) {
                          localStorage.removeItem(SAVED_CREDENTIALS_KEY);
                          setHasSavedCredentials(false);
                        }
                      } catch {}
                    }}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <span>Remember Login (Auto-Fill)</span>
                </label>

                {hasSavedCredentials && (
                  <button
                    type="button"
                    onClick={handleClearSavedCredentials}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Clear saved login credentials from this device"
                  >
                    Clear Saved
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
              >
                <span>
                  {isLoading
                    ? 'Verifying credentials...'
                    : username.toLowerCase().trim() === 'kgfilewala@gmail.com'
                    ? 'Sign In to Admin Panel'
                    : 'Sign In'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Username or Email ID */}
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1"
                >
                  Username or Email ID *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-email"
                    type="text"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Enter username or email"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900 transition-colors placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1"
                >
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900 transition-colors placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile Phone (Optional) */}
              <div>
                <label
                  htmlFor="reg-phone"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1"
                >
                  Mobile Phone (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Enter mobile number (e.g. 8598912555)"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Package Selection (1 Month: ₹500, 3 Month: ₹1299, 6 Month: ₹2199, 1 Year: ₹2999) */}
              <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-2xl p-3.5 mt-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    <span>Select Package / प्लान चुनें</span>
                  </label>
                  {(() => {
                    const activePkg = PACKAGES.find((p) => p.id === selectedPlan) || PACKAGES[0];
                    return (
                      <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>₹{activePkg.price.toLocaleString('en-IN')}</span>
                        <span className="text-emerald-500">•</span>
                        <span>{activePkg.duration}</span>
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {PACKAGES.map((pkg) => {
                    const isSelected = selectedPlan === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPlan(pkg.id)}
                        className={`relative p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none active:scale-97 ${
                          isSelected
                            ? 'bg-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                            : 'bg-white/80 hover:bg-white border-slate-200/90 text-slate-700'
                        }`}
                      >
                        {pkg.tag && (
                          <span className="absolute -top-2 right-2 text-[9px] font-black uppercase tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-1.5 py-0.5 rounded-full shadow-2xs">
                            {pkg.tag}
                          </span>
                        )}
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-black ${
                              isSelected ? 'text-emerald-950' : 'text-slate-800'
                            }`}
                          >
                            {pkg.title}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Price display */}
                        <div className="mt-1.5 flex items-baseline gap-1.5">
                          <span
                            className={`text-sm font-black tracking-tight ${
                              isSelected ? 'text-emerald-700' : 'text-slate-900'
                            }`}
                          >
                            ₹{pkg.price.toLocaleString('en-IN')}
                          </span>
                          {pkg.originalPrice && (
                            <span className="text-[10px] text-slate-400 line-through font-semibold">
                              ₹{pkg.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-slate-500">
                          <span>{pkg.duration}</span>
                          {pkg.saveText && (
                            <span className="text-emerald-600 font-bold">{pkg.saveText}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save Name & Password on this device */}
              <div className="pt-0.5 pb-1">
                <label
                  htmlFor="chk-reg-save-credentials"
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none hover:text-emerald-700 transition-colors"
                >
                  <input
                    id="chk-reg-save-credentials"
                    type="checkbox"
                    checked={saveCredentials}
                    onChange={(e) => setSaveCredentials(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <span>Save Name & Password on this device</span>
                </label>
              </div>

              {/* Submit Register */}
              <button
                id="btn-register-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {isLoading
                    ? 'Creating account...'
                    : (() => {
                        const pkg = PACKAGES.find((p) => p.id === selectedPlan) || PACKAGES[0];
                        return `Register Account (${pkg.title} • ₹${pkg.price.toLocaleString('en-IN')})`;
                      })()}
                </span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Already have an account? Sign in here
                </button>
              </div>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secure UPI Merchant Portal</span>
            </div>
            <span>v2.1 Realtime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

