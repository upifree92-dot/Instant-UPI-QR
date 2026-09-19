import React from 'react';
import { Check, Volume2, ShieldCheck, X } from 'lucide-react';
import { MerchantConfig } from '../types';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  amount: number;
  config: MerchantConfig;
  onClose: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  amount,
  config,
  onClose,
}) => {
  if (!isOpen) return null;

  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-sm border-2 border-emerald-500 overflow-hidden flex flex-col items-center text-center p-6 pt-8 animate-in zoom-in-90 duration-300 cursor-default"
      >
        {/* Close Icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Animated Right Logo (Green Checkmark) */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* Pulsing ring animation */}
          <div className="absolute w-28 h-28 rounded-full bg-emerald-400/25 animate-ping" />
          <div className="absolute w-24 h-24 rounded-full bg-emerald-100 animate-pulse" />

          {/* Primary Right Checkmark Badge */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-600/40 border-4 border-white">
            <Check className="w-11 h-11 text-white stroke-[3.5] animate-in zoom-in-50 duration-300" />
          </div>
        </div>

        {/* Soundbox Voice Badge */}
        <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
          <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
          <span>
            {config.language === 'hi' ? 'साउंडबॉक्स अलर्ट' : 'Soundbox Voice Alert'}
          </span>
        </div>

        {/* Large Amount Display */}
        <div className="mb-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
            {config.language === 'hi' ? 'भुगतान प्राप्त हुआ' : 'Payment Received'}
          </span>
          <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            ₹{amount % 1 === 0 ? amount : amount.toFixed(2)}
          </div>
        </div>

        {/* Success Status Text */}
        <p className="text-sm font-bold text-emerald-700 mb-4">
          {config.language === 'hi'
            ? 'पेमेंट सफलतापूर्वक प्राप्त हुआ!'
            : 'Payment Successful!'}
        </p>

        {/* Store & Transaction Details Card */}
        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-left text-xs space-y-2 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">To Merchant:</span>
            <span className="font-bold text-slate-800 truncate max-w-[170px]">
              {config.storeName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">UPI ID:</span>
            <span className="font-mono text-slate-700 font-semibold truncate max-w-[170px]">
              {config.upiId}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span className="text-slate-500 font-medium">Time:</span>
            <span className="font-semibold text-slate-800">
              Today, {currentTime}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Status:</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified by NPCI UPI
            </span>
          </div>
        </div>

        {/* Dismiss / Done Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
        >
          {config.language === 'hi' ? 'ठीक है (Done)' : 'Done'}
        </button>
      </div>
    </div>
  );
};
