import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  QrCode,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (userEmail: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      if (trimmedUser === 'demo@gmail.com' && trimmedPass === 'demo') {
        setIsLoading(false);
        onLoginSuccess('demo@gmail.com');
      } else {
        setIsLoading(false);
        setError('Invalid credentials. Use demo@gmail.com and password demo.');
      }
    }, 300);
  };

  const handleQuickDemoFill = () => {
    setUsername('demo@gmail.com');
    setPassword('demo');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f0f5f3] flex flex-col items-center justify-center py-8 px-4 selection:bg-emerald-200">
      <div className="w-full max-w-md">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-700/25 mb-3">
            <QrCode className="w-9 h-9 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Instant UPI Merchant
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Sign in to access your QR generator & smart soundbox
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[26px] border-2 border-emerald-200/90 shadow-sm p-6 sm:p-7">
          {/* Top Security Banner */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-800">
              <span className="font-extrabold text-sm tracking-wide text-emerald-950">
                BHIM UPI Portal
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[2.4]" />
            </div>
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              Merchant Login
            </span>
          </div>

          {/* Quick Demo Credentials Pill */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 mb-5 flex items-center justify-between gap-2">
            <div className="text-xs">
              <div className="flex items-center gap-1 text-amber-800 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Demo Credentials:</span>
              </div>
              <p className="text-slate-600 font-mono text-[11px] mt-0.5">
                <span className="font-semibold text-slate-800">demo@gmail.com</span> / <span className="font-semibold text-slate-800">demo</span>
              </p>
            </div>
            <button
              id="btn-quick-fill-demo"
              type="button"
              onClick={handleQuickDemoFill}
              className="shrink-0 bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-extrabold text-xs px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
            >
              Fill Demo
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Username or Email
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
                  placeholder="demo@gmail.com"
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

            {/* Submit Button */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In to Merchant Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Session &bull; Verified Merchant Terminal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
