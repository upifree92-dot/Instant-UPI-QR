/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { UpiCard } from './components/UpiCard';
import { AmountSection } from './components/AmountSection';
import { SettingsModal } from './components/SettingsModal';
import { ShareModal } from './components/ShareModal';
import { PaymentSuccessModal } from './components/PaymentSuccessModal';
import { SoundboxCard } from './components/SoundboxCard';
import { LoginPage } from './components/LoginPage';
import { AdminPanel } from './components/AdminPanel';
import { MerchantConfig, UserRole } from './types';
import { announceSoundbox } from './utils/sound';
import { buildUpiPayUrl } from './utils/upi';
import { Volume2, CheckCircle2, Share2, ShieldCheck, ArrowLeft, User, Cloud, Edit3, Check, X } from 'lucide-react';
import { fetchMerchantConfigFromCloud, saveMerchantConfigToCloud } from './lib/supabase';
import { getUserByEmail, getUserValidityInfo, updateUserAccountName } from './lib/userStore';

const STORAGE_KEY = 'upi_merchant_config_v1';
const AUTH_STORAGE_KEY = 'upi_merchant_authenticated_v1';
const USER_ROLE_KEY = 'upi_merchant_user_role';
const LOGGED_IN_USER_KEY = 'upi_merchant_logged_in_user';
const STORE_NAME_KEY = 'upi_merchant_store_name';
const UPI_ID_KEY = 'upi_merchant_vpa_id';

const DEFAULT_CONFIG: MerchantConfig = {
  storeName: 'Sharma General Store',
  upiId: 'sharmastore@okhdfcbank',
  extraPercentage: 2,
  isExtraEnabled: true,
  currency: 'INR',
  note: 'Bill Payment',
  soundboxVoice: true,
  language: 'en',
};

export default function App() {
  const [config, setConfig] = useState<MerchantConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedStoreName = localStorage.getItem(STORE_NAME_KEY);
      const savedUpiId = localStorage.getItem(UPI_ID_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          storeName: savedStoreName || parsed.storeName || DEFAULT_CONFIG.storeName,
          upiId: savedUpiId || parsed.upiId || DEFAULT_CONFIG.upiId,
          language: parsed.language || 'en',
        };
      } else if (savedStoreName || savedUpiId) {
        return {
          ...DEFAULT_CONFIG,
          storeName: savedStoreName || DEFAULT_CONFIG.storeName,
          upiId: savedUpiId || DEFAULT_CONFIG.upiId,
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  });

  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<{
    show: boolean;
    amount: number;
  }>({ show: false, amount: 0 });

  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(USER_ROLE_KEY);
      if (saved === 'admin' || saved === 'merchant' || saved === 'customer') return saved as UserRole;
    } catch {
      // fallback
    }
    return 'customer';
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    try {
      return localStorage.getItem(LOGGED_IN_USER_KEY) || '';
    } catch {
      return '';
    }
  });

  const [userStoreVersion, setUserStoreVersion] = useState<number>(0);
  const [accountRenameText, setAccountRenameText] = useState<string>('');
  const [isRenamingAccount, setIsRenamingAccount] = useState<boolean>(false);
  const [renameAutoSaved, setRenameAutoSaved] = useState<boolean>(false);

  const currentUser = useMemo(() => {
    if (!currentUserEmail) return undefined;
    return getUserByEmail(currentUserEmail);
  }, [currentUserEmail, userStoreVersion]);

  const customerValidity = useMemo(() => {
    if (!currentUser) return null;
    return getUserValidityInfo(currentUser);
  }, [currentUser]);

  // Automatic saving of customer account rename
  const handleAutoSaveAccountName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    // 1. Update config storeName
    const updatedConfig: MerchantConfig = {
      ...config,
      storeName: trimmed,
    };
    setConfig(updatedConfig);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
      localStorage.setItem(STORE_NAME_KEY, trimmed);
    } catch {
      // storage error fallback
    }

    // 2. Update user profile in persistent user store
    if (currentUserEmail) {
      updateUserAccountName(currentUserEmail, trimmed, trimmed);
      setUserStoreVersion((v) => v + 1);
    }

    // 3. Auto-sync to Supabase cloud
    saveMerchantConfigToCloud(updatedConfig);

    // 4. Show Auto-Saved confirmation feedback
    setRenameAutoSaved(true);
    setTimeout(() => {
      setRenameAutoSaved(false);
    }, 2500);
  };

  const [currentView, setCurrentView] = useState<'terminal' | 'admin'>(() => {
    try {
      const saved = localStorage.getItem(USER_ROLE_KEY);
      if (saved === 'admin') return 'admin';
    } catch {
      // fallback
    }
    return 'terminal';
  });

  const handleLoginSuccess = (user: string, role: UserRole) => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      localStorage.setItem(USER_ROLE_KEY, role);
      localStorage.setItem(LOGGED_IN_USER_KEY, user);
    } catch {
      // storage error fallback
    }
    setIsAuthenticated(true);
    setUserRole(role);
    setCurrentUserEmail(user);

    // If customer has a registered store/businessName, sync it to config
    const registered = getUserByEmail(user);
    if (registered && registered.businessName) {
      setConfig((prev) => ({
        ...prev,
        storeName: registered.businessName || prev.storeName,
      }));
    }

    // Only allow admin into admin panel
    setCurrentView(role === 'admin' ? 'admin' : 'terminal');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(USER_ROLE_KEY);
      localStorage.removeItem(LOGGED_IN_USER_KEY);
      // NOTE: We do NOT wipe out STORE_NAME_KEY or UPI_ID_KEY so merchant details persist
    } catch {
      // storage error fallback
    }
    setIsAuthenticated(false);
    setUserRole('customer');
    setCurrentUserEmail('');
    setCurrentView('terminal');
    setBaseAmount(0);
  };

  // Fetch latest config from Supabase Cloud on startup
  useEffect(() => {
    fetchMerchantConfigFromCloud().then((cloudConfig) => {
      if (cloudConfig && (cloudConfig.storeName || cloudConfig.upiId)) {
        setConfig((prev) => ({
          ...prev,
          ...cloudConfig,
          storeName: cloudConfig.storeName || prev.storeName,
          upiId: cloudConfig.upiId || prev.upiId,
        }));
      }
    });
  }, []);

  // Save config to localStorage immediately & whenever updated, and sync to Supabase Cloud
  const handleSaveConfig = (newConfig: MerchantConfig) => {
    const updated: MerchantConfig = {
      ...newConfig,
      storeName: newConfig.storeName.trim() || 'Sharma General Store',
      upiId: newConfig.upiId.trim() || 'sharmastore@okhdfcbank',
    };
    setConfig(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(STORE_NAME_KEY, updated.storeName);
      localStorage.setItem(UPI_ID_KEY, updated.upiId);
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
    // Background cloud sync to Supabase
    saveMerchantConfigToCloud(updated);
  };

  const handleResetDefaults = () => {
    // Preserve custom store name & UPI address so user's work is never lost!
    setConfig((prev) => {
      const updated: MerchantConfig = {
        ...DEFAULT_CONFIG,
        storeName: prev.storeName,
        upiId: prev.upiId,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Keep localStorage in sync with config changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      if (config.storeName) {
        localStorage.setItem(STORE_NAME_KEY, config.storeName);
      }
      if (config.upiId) {
        localStorage.setItem(UPI_ID_KEY, config.upiId);
      }
    } catch {
      // storage error fallback
    }
  }, [config]);

  // Calculate final amount with surcharge
  const finalAmount = useMemo(() => {
    if (baseAmount <= 0) return 0;
    if (!config.isExtraEnabled || config.extraPercentage <= 0) {
      return baseAmount;
    }
    const extra = (baseAmount * config.extraPercentage) / 100;
    return Math.round((baseAmount + extra) * 100) / 100;
  }, [baseAmount, config.isExtraEnabled, config.extraPercentage]);

  // UPI deep link for current selection
  const upiUrl = useMemo(() => {
    return buildUpiPayUrl(config, finalAmount);
  }, [config, finalAmount]);

  // Toggle extra percentage surcharge ON/OFF
  const handleToggleExtra = () => {
    setConfig((prev) => ({
      ...prev,
      isExtraEnabled: !prev.isExtraEnabled,
    }));
  };

  // Reset current amount to 0
  const handleResetAmount = () => {
    setBaseAmount(0);
  };

  // Reset store details & amounts to original default
  const handleExitOrFullReset = () => {
    setBaseAmount(0);
  };

  // Toggle between English and Hindi
  const handleToggleLanguage = () => {
    setConfig((prev) => ({
      ...prev,
      language: prev.language === 'en' ? 'hi' : 'en',
    }));
  };

  // Test Soundbox Voice announcement
  const handleTriggerSoundboxTest = (customAmount?: number) => {
    const soundAmount = customAmount ?? (finalAmount > 0 ? finalAmount : 102);
    announceSoundbox(soundAmount, config.language, config.storeName);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
    });

    setPaymentSuccessToast({
      show: true,
      amount: soundAmount,
    });

    setTimeout(() => {
      setPaymentSuccessToast({ show: false, amount: 0 });
    }, 4000);
  };

  // If user is not authenticated, show Merchant / Admin Login Page
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // If currently in Admin Panel view - Strictly restricted to admin role only
  if (currentView === 'admin' && userRole === 'admin') {
    return (
      <AdminPanel
        config={config}
        onSaveConfig={handleSaveConfig}
        onSwitchToTerminal={() => setCurrentView('terminal')}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f5f3] flex flex-col items-center py-4 px-3 sm:px-4 selection:bg-emerald-200">
      {/* Container simulating smartphone/counter view */}
      <div className="w-full max-w-md flex flex-col space-y-3.5 pb-8">
        {/* Admin Bar if logged in as Admin */}
        {userRole === 'admin' && (
          <div className="bg-slate-900 text-white px-3.5 py-2 rounded-xl flex items-center justify-between text-xs border border-emerald-500/40 shadow-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin Control Mode</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentView('admin')}
              className="text-[11px] font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Admin Panel</span>
              <span>&rarr;</span>
            </button>
          </div>
        )}

        {/* Top Header */}
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onReset={handleResetAmount}
          onExit={handleLogout}
          language={config.language}
          onToggleLanguage={handleToggleLanguage}
          isAdmin={userRole === 'admin'}
          onSwitchToAdmin={userRole === 'admin' ? () => setCurrentView('admin') : undefined}
        />

        {/* Customer Account & Supabase Cloud Connection Status Card */}
        {userRole !== 'admin' && (
          <div className="bg-white/95 rounded-2xl p-3 border border-emerald-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center font-extrabold shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-800 text-xs truncate max-w-[150px] sm:max-w-[200px]">
                      {currentUser?.businessName || currentUser?.name || config.storeName}
                    </span>

                    {/* Rename Button */}
                    <button
                      id="btn-front-rename-account"
                      type="button"
                      onClick={() => {
                        setAccountRenameText(
                          currentUser?.businessName || currentUser?.name || config.storeName
                        );
                        setIsRenamingAccount(!isRenamingAccount);
                      }}
                      className="text-[10px] font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
                      title="Rename account - automatically saves"
                    >
                      <Edit3 className="w-2.5 h-2.5 text-emerald-700" />
                      <span>{isRenamingAccount ? 'Cancel' : 'Rename'}</span>
                    </button>

                    {/* Auto-saved badge */}
                    {renameAutoSaved && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-md flex items-center gap-1 animate-in fade-in shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                        <span>Auto-saved</span>
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 flex-wrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      Valid: {customerValidity?.planLabel || 'Active Plan'}
                    </span>
                    {customerValidity && !customerValidity.isLifetime && (
                      <span className="text-slate-500 font-medium">
                        ({customerValidity.daysRemaining} days left)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Supabase Connect Button - Opens Settings */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                title="Supabase Cloud Database Connected - Open Settings to view details"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500 shrink-0" />
                <span className="hidden xs:inline">Supabase</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            </div>

            {/* Inline Rename Box with instant automatic saving */}
            {isRenamingAccount && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 animate-in fade-in">
                <input
                  id="input-account-rename-name"
                  type="text"
                  value={accountRenameText}
                  onChange={(e) => {
                    setAccountRenameText(e.target.value);
                    handleAutoSaveAccountName(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAutoSaveAccountName(accountRenameText);
                      setIsRenamingAccount(false);
                    }
                  }}
                  placeholder="Enter new business / store name"
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-xl text-xs font-bold text-slate-800"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    handleAutoSaveAccountName(accountRenameText);
                    setIsRenamingAccount(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Done</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main UPI QR Display Card */}
        <UpiCard
          config={config}
          finalAmount={finalAmount}
          baseAmount={baseAmount}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Bill / Balance Amount & Quick Surcharges Section */}
        <AmountSection
          config={config}
          onToggleExtra={handleToggleExtra}
          baseAmount={baseAmount}
          onAmountChange={setBaseAmount}
        />

        {/* Share Selected Amount & QR Section */}
        <div className="px-1 pt-0.5">
          <button
            id="btn-share-all"
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold shadow-sm active:scale-98 transition-all cursor-pointer"
            title="Share QR image, link, or send to other apps"
          >
            <Share2 className="w-4 h-4" />
            <span>
              Share QR {finalAmount > 0 ? `(₹${finalAmount % 1 === 0 ? finalAmount : finalAmount.toFixed(2)})` : ''}
            </span>
          </button>
        </div>

        {/* Interactive Smart Soundbox Counter Device */}
        <div className="pt-1 px-0.5">
          <SoundboxCard
            config={config}
            currentAmount={finalAmount}
            onTriggerVoice={(amt) => handleTriggerSoundboxTest(amt)}
            onToggleLanguage={handleToggleLanguage}
          />
        </div>
      </div>

      {/* Simulated Soundbox Voice Toast */}
      {paymentSuccessToast.show && (
        <div className="fixed bottom-6 z-50 animate-in slide-in-from-bottom duration-300 max-w-sm w-[90%]">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-500/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider">
                Soundbox Alert
              </p>
              <p className="text-sm font-extrabold text-white">
                Payment of ₹{paymentSuccessToast.amount} Received
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={handleSaveConfig}
        onResetDefaults={handleResetDefaults}
        isAdmin={userRole === 'admin'}
        onOpenAdminPanel={userRole === 'admin' ? () => setCurrentView('admin') : undefined}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        config={config}
        finalAmount={finalAmount}
        baseAmount={baseAmount}
        upiUrl={upiUrl}
      />

      {/* Payment Received Right Logo Display Modal */}
      <PaymentSuccessModal
        isOpen={paymentSuccessToast.show}
        amount={paymentSuccessToast.amount}
        config={config}
        onClose={() => setPaymentSuccessToast({ show: false, amount: 0 })}
      />
    </div>
  );
}
