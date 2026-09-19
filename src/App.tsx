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
import { MerchantConfig } from './types';
import { announceSoundbox } from './utils/sound';
import { buildUpiPayUrl } from './utils/upi';
import { Volume2, CheckCircle2, Share2, MessageCircle } from 'lucide-react';

const STORAGE_KEY = 'upi_merchant_config_v1';

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
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_CONFIG, ...parsed, language: parsed.language || 'en' };
      }
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  });

  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<{
    show: boolean;
    amount: number;
  }>({ show: false, amount: 0 });

  // Save config to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
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

  // Direct WhatsApp Share of selected payment
  const handleQuickWhatsAppShare = () => {
    const displayAmt =
      finalAmount > 0
        ? finalAmount % 1 === 0
          ? finalAmount
          : finalAmount.toFixed(2)
        : null;

    const message = displayAmt
      ? `*Payment Request from ${config.storeName}*\n💰 *Amount to Pay: ₹${displayAmt}*\n\n👉 Click to pay instantly using GPay, PhonePe, Paytm or BHIM UPI:\n${upiUrl}`
      : `*UPI Payment Request from ${config.storeName}*\n\n👉 Pay to UPI ID: *${config.upiId}*\nClick to pay:\n${upiUrl}`;

    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

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

  return (
    <div className="min-h-screen bg-[#f0f5f3] flex flex-col items-center py-4 px-3 sm:px-4 selection:bg-emerald-200">
      {/* Container simulating smartphone/counter view */}
      <div className="w-full max-w-md flex flex-col space-y-3.5 pb-8">
        {/* Top Header */}
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onReset={handleResetAmount}
          onExit={handleExitOrFullReset}
          language={config.language}
          onToggleLanguage={handleToggleLanguage}
        />

        {/* Main UPI QR Display Card */}
        <UpiCard
          config={config}
          finalAmount={finalAmount}
          baseAmount={baseAmount}
        />

        {/* Bill / Balance Amount & Quick Surcharges Section */}
        <AmountSection
          config={config}
          onToggleExtra={handleToggleExtra}
          baseAmount={baseAmount}
          onAmountChange={setBaseAmount}
        />

        {/* Share Selected Amount & QR Section */}
        <div className="flex items-center gap-2 px-1 pt-0.5">
          <button
            id="btn-whatsapp-share"
            type="button"
            onClick={handleQuickWhatsAppShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-extrabold shadow-sm active:scale-98 transition-all cursor-pointer"
            title="Send this payment directly to customer on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>
              WhatsApp {finalAmount > 0 ? `(₹${finalAmount})` : 'QR'}
            </span>
          </button>

          <button
            id="btn-share-all"
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center justify-center gap-1.5 py-3 px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold shadow-sm active:scale-98 transition-all cursor-pointer"
            title="Share QR image, link, or send to other apps"
          >
            <Share2 className="w-4 h-4" />
            <span>Share QR</span>
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
                {config.language === 'hi'
                  ? `₹${paymentSuccessToast.amount} प्राप्त हुए`
                  : `Payment of ₹${paymentSuccessToast.amount} Received`}
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
        onSave={(newCfg) => setConfig(newCfg)}
        onResetDefaults={() => setConfig(DEFAULT_CONFIG)}
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
