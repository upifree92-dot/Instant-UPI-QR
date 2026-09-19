import React, { useState } from 'react';
import { X, Store, CreditCard, Percent, Volume2, Save, RotateCcw } from 'lucide-react';
import { MerchantConfig } from '../types';
import { announceSoundbox } from '../utils/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MerchantConfig;
  onSave: (newConfig: MerchantConfig) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onResetDefaults,
}) => {
  const [formData, setFormData] = useState<MerchantConfig>({ ...config });

  // Sync state if config updates externally
  React.useEffect(() => {
    setFormData({ ...config });
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const testVoice = () => {
    announceSoundbox(102, formData.language);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Merchant Settings
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Configure store and UPI QR details
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Store Name */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Store / Business Name</span>
            </label>
            <input
              type="text"
              required
              value={formData.storeName}
              onChange={(e) =>
                setFormData({ ...formData, storeName: e.target.value })
              }
              placeholder="e.g. Sharma General Store"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-semibold text-slate-800"
            />
          </div>

          {/* UPI ID / VPA */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>UPI ID / VPA (Receiving UPI Address)</span>
            </label>
            <input
              type="text"
              required
              value={formData.upiId}
              onChange={(e) =>
                setFormData({ ...formData, upiId: e.target.value })
              }
              placeholder="e.g. sharmastore@okhdfcbank or yournumber@ybl"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-medium text-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Supports Google Pay, PhonePe, Paytm, BHIM, Amazon Pay & all UPI apps.
            </p>
          </div>

          {/* Extra Percentage Surcharge */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <Percent className="w-4 h-4 text-emerald-700" />
                <span>Auto Extra Charge %</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="enable-extra-toggle"
                  checked={formData.isExtraEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, isExtraEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="enable-extra-toggle"
                  className="text-xs font-bold text-emerald-800 cursor-pointer"
                >
                  Enabled
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={formData.extraPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    extraPercentage: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-24 px-3 py-2 rounded-xl border border-emerald-300 bg-white text-emerald-900 font-extrabold text-base text-center outline-none focus:ring-2 focus:ring-emerald-200"
              />
              <span className="text-sm font-bold text-emerald-800">%</span>

              {/* Quick % chips */}
              <div className="flex items-center gap-1 ml-auto">
                {[1, 2, 2.5, 3].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setFormData({ ...formData, extraPercentage: pct })}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                      formData.extraPercentage === pct
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Soundbox Voice Simulator */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>Soundbox Voice Alert</span>
              </label>
              <input
                type="checkbox"
                checked={formData.soundboxVoice}
                onChange={(e) =>
                  setFormData({ ...formData, soundboxVoice: e.target.checked })
                }
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span>Language:</span>
                <select
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      language: e.target.value as 'hi' | 'en',
                    })
                  }
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={testVoice}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2 flex items-center gap-1"
              >
                <span>Test Voice</span>
              </button>
            </div>
          </div>

          {/* Payment Note */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Payment Note / Bill Ref (Optional)
            </label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="e.g. Store Bill Payment"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm text-slate-800"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
            <button
              type="button"
              onClick={onResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default (Sharma General Store)</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95 ml-auto"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
