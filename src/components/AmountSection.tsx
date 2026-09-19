import React from 'react';
import { Zap, Check, X, Minus, Plus } from 'lucide-react';
import { MerchantConfig } from '../types';

interface AmountSectionProps {
  config: MerchantConfig;
  onToggleExtra: () => void;
  baseAmount: number;
  onAmountChange: (amount: number) => void;
}

interface QuickOption {
  amount: number;
}

const FALLBACK_PRESETS: number[] = [50, 80, 100, 200, 500, 1000, 2000, 2020];

export const AmountSection: React.FC<AmountSectionProps> = ({
  config,
  onToggleExtra,
  baseAmount,
  onAmountChange,
}) => {
  const [activePresets] = React.useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('upi_merchant_presets_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return FALLBACK_PRESETS;
  });

  // Compute calculated QR amount for any base amount
  const calculateQrAmount = (base: number): number => {
    if (!config.isExtraEnabled || config.extraPercentage <= 0) {
      return base;
    }
    const extra = (base * config.extraPercentage) / 100;
    // Round to 2 decimal places cleanly
    return Math.round((base + extra) * 100) / 100;
  };

  const handleIncrement = () => {
    const step = baseAmount < 50 ? 5 : baseAmount < 200 ? 10 : 50;
    onAmountChange(baseAmount + step);
  };

  const handleDecrement = () => {
    const step = baseAmount <= 10 ? 1 : baseAmount <= 50 ? 5 : baseAmount <= 200 ? 10 : 50;
    const next = Math.max(0, baseAmount - step);
    onAmountChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    const num = parseFloat(val);
    if (isNaN(num)) {
      onAmountChange(0);
    } else {
      onAmountChange(Math.min(999999, Math.max(0, num)));
    }
  };

  const formatDisplay = (num: number): string => {
    if (num % 1 === 0) return num.toString();
    return num.toFixed(1).replace(/\.0$/, '');
  };

  return (
    <div
      id="bill-amount-container"
      className="bg-white rounded-[24px] border-2 border-emerald-500 p-4 sm:p-5 w-full shadow-sm"
    >
      {/* Top Header: Bill / Balance Amount + Toggle Badge */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-400 stroke-[2.2]" />
            <div className="leading-tight">
              <h3 className="text-slate-900 font-extrabold text-[15px] sm:text-base tracking-tight uppercase">
                BILL / BALANCE
              </h3>
              <h4 className="text-slate-900 font-extrabold text-[15px] sm:text-base tracking-tight uppercase">
                AMOUNT (₹)
              </h4>
            </div>
          </div>
          <p className="text-[12px] text-slate-500 font-medium mt-1.5 leading-snug">
            {config.isExtraEnabled && config.extraPercentage > 0 ? (
              <>
                +{config.extraPercentage}% auto-adds in QR (e.g. 100 → ₹
                {calculateQrAmount(100)})
              </>
            ) : (
              'Extra charge is turned OFF'
            )}
          </p>
        </div>

        {/* Right Toggle Button (+2% Extra ON / चालू) */}
        <button
          id="btn-toggle-extra"
          type="button"
          onClick={onToggleExtra}
          title={
            config.isExtraEnabled
              ? 'Click to turn OFF extra charge'
              : 'Click to turn ON extra charge'
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
            config.isExtraEnabled
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
          }`}
        >
          {config.isExtraEnabled ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>
                +{config.extraPercentage}% Extra{' '}
                {config.language === 'hi' ? 'चालू' : 'ON'}
              </span>
            </>
          ) : (
            <>
              <X className="w-3.5 h-3.5 stroke-[3]" />
              <span>Extra {config.language === 'hi' ? 'बंद' : 'OFF'}</span>
            </>
          )}
        </button>
      </div>

      {/* Amount Input Row with Minus & Plus buttons */}
      <div className="flex items-center justify-between gap-2 my-2">
        <button
          type="button"
          onClick={handleDecrement}
          title="Minus"
          disabled={baseAmount <= 0}
          className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 font-bold text-2xl flex items-center justify-center transition-colors active:scale-95 shadow-2xs shrink-0"
        >
          <Minus className="w-5 h-5 stroke-[2.8]" />
        </button>

        <div className="flex-1 min-h-[56px] px-3 py-1.5 rounded-2xl border-2 border-emerald-400/90 bg-white flex items-center justify-center focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-200 transition-all shadow-xs">
          <span className="text-emerald-700 font-extrabold text-2xl sm:text-3xl mr-2 select-none">
            ₹
          </span>
          <input
            id="input-base-amount"
            type="text"
            inputMode="decimal"
            value={baseAmount === 0 ? '0' : baseAmount}
            onChange={handleInputChange}
            onFocus={(e) => {
              if (baseAmount === 0) e.target.select();
            }}
            placeholder="0"
            className="w-full text-center text-3xl sm:text-4xl font-extrabold text-slate-900 bg-transparent outline-none tracking-tight"
          />
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          title="Plus"
          className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-2xl flex items-center justify-center transition-colors active:scale-95 shadow-2xs shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.8]" />
        </button>
      </div>

      {/* Quick Amounts Header */}
      <div className="flex items-center justify-between mt-5 mb-2.5 px-0.5">
        <span className="text-[13px] font-bold text-slate-800">
          Quick Amounts:
        </span>
        {config.isExtraEnabled && config.extraPercentage > 0 && (
          <span className="text-[12px] font-bold text-emerald-700 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            <span>+{config.extraPercentage}% Extra Auto</span>
          </span>
        )}
      </div>

      {/* Quick Amounts Grid matching screenshot */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {activePresets.map((amountVal) => {
          const qrVal = calculateQrAmount(amountVal);
          const isSelected = baseAmount === amountVal;

          return (
            <button
              key={amountVal}
              type="button"
              onClick={() => onAmountChange(amountVal)}
              className={`px-3 py-2.5 rounded-xl text-center transition-all flex items-center justify-center gap-1 font-medium active:scale-98 ${
                isSelected
                  ? 'border-2 border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                  : 'border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-800'
              }`}
            >
              <span className="text-sm font-bold text-slate-900">
                ₹{amountVal}
              </span>
              <span
                className={`text-xs font-semibold ${
                  isSelected ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                (QR: ₹{formatDisplay(qrVal)})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
