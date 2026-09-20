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
import { Volume2, CheckCircle2, Share2, ShieldCheck, ArrowLeft, User } from 'lucide-react';
import { fetchMerchantConfigFromCloud, saveMerchantConfigToCloud } from './lib/supabase';
import {
  getUserByEmail,
  getUserValidityInfo,
  updateUserAccountName,
  getUserSavedConfig,
  saveUserCustomConfig,
} from './lib/userStore';

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
      const activeUser = localStorage.getItem(LOGGED_IN_USER_KEY);
      if (activeUser) {
        const userSaved = getUserSavedConfig(activeUser);
        if (userSaved) {
          return {
            ...DEFAULT_CONFIG,
            ...userSaved,
            storeName: userSaved.storeName || DEFAULT_CONFIG.storeName,
            upiId: userSaved.upiId || DEFAULT_CONFIG.upiId,
            extraPercentage:
              userSaved.extraPercentage !== undefined
                ? userSaved.extraPercentage
                : DEFAULT_CONFIG.extraPercentage,
            isExtraEnabled:
              userSaved.isExtraEnabled !== undefined
                ? userSaved.isExtraEnabled
                : DEFAULT_CONFIG.isExtraEnabled,
          };
        }
      }

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

  const currentUser = useMemo(() => {
    if (!currentUserEmail) return undefined;
    return getUserByEmail(currentUserEmail);
  }, [currentUserEmail, userStoreVersion]);

  const customerValidity = useMemo(() => {
    if (!currentUser) return null;
    return getUserValidityInfo(currentUser);
  }, [currentUser]);

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

    // Load THIS specific user ID's saved storeName, UPI ID, extra percentage
    const userSaved = getUserSavedConfig(user);
    const registered = getUserByEmail(user);

    setConfig((prev) => {
      const updatedUserConfig: MerchantConfig = {
        ...DEFAULT_CONFIG,
        ...prev,
        ...userSaved,
        storeName:
          userSaved?.storeName ||
          registered?.businessName ||
          (user === 'demo9090' ? 'Demo Store' : prev.storeName),
        upiId:
          userSaved?.upiId ||
          registered?.upiId ||
          prev.upiId,
        extraPercentage:
          userSaved?.extraPercentage !== undefined
            ? userSaved.extraPercentage
            : (registered?.extraPercentage !== undefined ? registered.extraPercentage : prev.extraPercentage),
        isExtraEnabled:
          userSaved?.isExtraEnabled !== undefined
            ? userSaved.isExtraEnabled
            : (registered?.isExtraEnabled !== undefined ? registered.isExtraEnabled : prev.isExtraEnabled),
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUserConfig));
        localStorage.setItem(STORE_NAME_KEY, updatedUserConfig.storeName);
        localStorage.setItem(UPI_ID_KEY, updatedUserConfig.upiId);
      } catch {
        // storage fallback
      }

      return updatedUserConfig;
    });

    // Only allow admin into admin panel
    setCurrentView(role === 'admin' ? 'admin' : 'terminal');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(USER_ROLE_KEY);
      localStorage.removeItem(LOGGED_IN_USER_KEY);
    } catch {
      // storage error fallback
    }
    setIsAuthenticated(false);
    setUserRole('customer');
    setCurrentUserEmail('');
    setCurrentView('terminal');
    setBaseAmount(0);
  };

  // Fetch latest config from Supabase Cloud on startup (protects user's saved config)
  useEffect(() => {
    fetchMerchantConfigFromCloud().then((cloudConfig) => {
      if (cloudConfig && (cloudConfig.storeName || cloudConfig.upiId)) {
        setConfig((prev) => {
          const userSaved = currentUserEmail ? getUserSavedConfig(currentUserEmail) : null;
          if (userSaved && (userSaved.storeName || userSaved.upiId)) {
            // Preserve user's personalized saved details
            return {
              ...prev,
              ...cloudConfig,
              storeName: userSaved.storeName || prev.storeName,
              upiId: userSaved.upiId || prev.upiId,
              extraPercentage:
                userSaved.extraPercentage !== undefined
                  ? userSaved.extraPercentage
                  : prev.extraPercentage,
              isExtraEnabled:
                userSaved.isExtraEnabled !== undefined
                  ? userSaved.isExtraEnabled
                  : prev.isExtraEnabled,
            };
          }
          return {
            ...prev,
            ...cloudConfig,
            storeName: cloudConfig.storeName || prev.storeName,
            upiId: cloudConfig.upiId || prev.upiId,
          };
        });
      }
    });
  }, [currentUserEmail]);

  // Save config to localStorage immediately & whenever updated, and sync to user profile & Supabase Cloud
  const handleSaveConfig = (newConfig: MerchantConfig) => {
    const updated: MerchantConfig = {
      ...newConfig,
      storeName: newConfig.storeName.trim() || 'Sharma General Store',
      upiId: newConfig.upiId.trim() || 'sharmastore@okhdfcbank',
      extraPercentage: Number(newConfig.extraPercentage),
      isExtraEnabled: Boolean(newConfig.isExtraEnabled),
    };
    setConfig(updated);

    // 1. Permanently bind and save to currentUserEmail ID
    if (currentUserEmail) {
      saveUserCustomConfig(currentUserEmail, updated);
      updateUserAccountName(currentUserEmail, updated.storeName, updated.storeName);
      setUserStoreVersion((v) => v + 1);
    }

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
        extraPercentage: prev.extraPercentage,
        isExtraEnabled: prev.isExtraEnabled,
      };
      if (currentUserEmail) {
        saveUserCustomConfig(currentUserEmail, updated);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Keep localStorage & user config in sync with config changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      if (config.storeName) {
        localStorage.setItem(STORE_NAME_KEY, config.storeName);
      }
      if (config.upiId) {
        localStorage.setItem(UPI_ID_KEY, config.upiId);
      }
      if (currentUserEmail) {
        saveUserCustomConfig(currentUserEmail, config);
      }
    } catch {
      // storage error fallback
    }
  }, [config, currentUserEmail]);

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
        initialTab="roles"
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
          isAdmin={userRole === 'admin'}
          onSwitchToAdmin={userRole === 'admin' ? () => setCurrentView('admin') : undefined}
        />

        {/* Customer Account Status Card */}
        {userRole !== 'admin' && (
          <div className="bg-white/95 rounded-2xl p-3 border border-emerald-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center font-extrabold shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-800 text-xs truncate max-w-[240px] sm:max-w-[320px]">
                      {currentUser?.businessName || currentUser?.name || config.storeName}
                    </span>
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
            </div>
          </div>
        )}

        {/* Main UPI QR Display Card */}
        <UpiCard
          config={config}
          finalAmount={finalAmount}
          baseAmount={baseAmount}
          onOpenSettings={userRole === 'admin' ? () => setIsSettingsOpen(true) : undefined}
          isCustomer={userRole !== 'admin'}
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
