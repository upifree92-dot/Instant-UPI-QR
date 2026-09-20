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
} from 'lucide-react';
import { UserRole } from '../types';
import { authenticateUser, registerCustomer } from '../lib/userStore';

const SAVED_CREDENTIALS_KEY = 'upi_saved_login_credentials_v1';
const REMEMBER_PREF_KEY = 'upi_remember_login_pref_v1';

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
  const [showRegPassword, setShowRegPassword] = useState(false);

  // UI status
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
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

    setTimeout(() => {
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
      }
    }, 250);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regName.trim()) {
      setError('Please enter your Name.');
      return;
    }
    if (!regEmail.trim()) {
      setError('Please enter your Email or User ID.');
      return;
    }
    if (!regPassword || regPassword.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const reg = registerCustomer({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        businessName: regStore,
        role: 'customer',
        status: 'active',
        validityPlan: 'lifetime',
      });

      setIsLoading(false);

      if (!reg.success) {
        setError(reg.error || 'Registration failed.');
        return;
      }

      setSuccessMsg(
        `Account registered successfully for ${regName}! You can now sign in.`
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
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#f0f5f3] flex flex-col items-center justify-center py-8 px-4 selection:bg-emerald-200">
      <div className="w-full max-w-md">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-700/25 mb-3">
            <QrCode className="w-9 h-9 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Instant UPI Portal
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Instant UPI Payment Terminal
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
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
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
                  <span>Save Name & Password (Auto-Fill)</span>
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
              {/* Name */}
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1"
                >
                  Your Name / Customer Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-sm font-semibold text-slate-900 transition-colors placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Email / User ID */}
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1"
                >
                  Email / User ID *
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
                    placeholder="e.g. ramesh@gmail.com or ramesh12"
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
                    placeholder="Create a password"
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

              {/* Mobile Phone & Business Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                      placeholder="9876543210"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-store"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1"
                  >
                    Store Name (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="reg-store"
                      type="text"
                      value={regStore}
                      onChange={(e) => setRegStore(e.target.value)}
                      placeholder="Sharma Traders"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>
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
                <span>{isLoading ? 'Creating account...' : 'Register Account'}</span>
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

