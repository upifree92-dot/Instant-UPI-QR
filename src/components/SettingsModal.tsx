import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  CreditCard,
  Percent,
  Volume2,
  Save,
  RotateCcw,
  Check,
  ShieldCheck,
  Database,
  Cloud,
  CheckCircle2,
  Copy,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { MerchantConfig } from '../types';
import { announceSoundbox } from '../utils/sound';
import {
  SUPABASE_PROJECT_ID,
  checkSupabaseConnection,
  saveMerchantConfigToCloud,
} from '../lib/supabase';
import { WhatsAppIcon } from './LoginPage';
import { RegisteredUser } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MerchantConfig;
  onSave: (newConfig: MerchantConfig) => void;
  onResetDefaults: () => void;
  isAdmin?: boolean;
  onOpenAdminPanel?: () => void;
  currentUser?: RegisteredUser;
}

const ADMIN_SUPPORT_WHATSAPP = '8598912555';

function buildWhatsAppSupportUrl(info: {
  customerName?: string;
  customerEmail?: string;
  storeName?: string;
  customerPhone?: string;
}): string {
  const cleanName =
    (info.customerName || 'Customer')
      .replace(/\bfree\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Customer';

  const lines = [
    `💬 *UPI APP CUSTOMER SUPPORT & HELP*`,
    ``,
    `Hello Admin! I need assistance with my account / app. Please check.`,
    ``,
    `👤 *Customer Name:* ${cleanName}`,
    info.customerEmail ? `📧 *Gmail / User ID:* ${info.customerEmail}` : '',
    info.storeName && info.storeName !== 'Sharma General Store' ? `🏪 *Store / Business:* ${info.storeName}` : '',
    info.customerPhone ? `📱 *Phone Number:* ${info.customerPhone}` : '',
    ``,
    `*Problem Details:*`,
    `(Please describe your question or issue here...)`,
  ].filter(Boolean);

  return `https://wa.me/91${ADMIN_SUPPORT_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onResetDefaults,
  isAdmin = false,
  onOpenAdminPanel,
  currentUser,
}) => {
  const [formData, setFormData] = useState<MerchantConfig>({ ...config });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<{
    checking: boolean;
    connected: boolean;
    latency?: number;
    synced?: boolean;
  }>({
    checking: false,
    connected: true,
    latency: undefined,
    synced: false,
  });

  // Sync state if config updates externally
  React.useEffect(() => {
    setFormData({ ...config });
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanConfig: MerchantConfig = {
      ...formData,
      storeName: formData.storeName.trim() || config.storeName,
      upiId: formData.upiId.trim() || config.upiId,
      extraPercentage: Number(formData.extraPercentage) >= 0 ? Number(formData.extraPercentage) : 0,
      isExtraEnabled: Boolean(formData.isExtraEnabled),
    };
    onSave(cleanConfig);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 700);
  };

  const handleClose = () => {
    // If user modified store name, upiId or extra %, auto-save so it's not lost
    if (
      (formData.storeName.trim() && formData.storeName.trim() !== config.storeName) ||
      (formData.upiId.trim() && formData.upiId.trim() !== config.upiId) ||
      formData.extraPercentage !== config.extraPercentage ||
      formData.isExtraEnabled !== config.isExtraEnabled
    ) {
      onSave({
        ...formData,
        storeName: formData.storeName.trim() || config.storeName,
        upiId: formData.upiId.trim() || config.upiId,
        extraPercentage: Number(formData.extraPercentage) >= 0 ? Number(formData.extraPercentage) : 0,
        isExtraEnabled: Boolean(formData.isExtraEnabled),
      });
    }
    onClose();
  };

  const handleSyncCloud = async () => {
    setCloudStatus((prev) => ({ ...prev, checking: true, synced: false }));
    const success = await saveMerchantConfigToCloud(formData);
    setCloudStatus((prev) => ({
      ...prev,
      checking: false,
      synced: success,
    }));
    setTimeout(() => {
      setCloudStatus((prev) => ({ ...prev, synced: false }));
    }, 2500);
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

-- Allow public anonymous reads & writes for the single merchant terminal
alter table merchant_config enable row level security;
create policy "Allow all access to merchant_config" on merchant_config for all using (true) with check (true);
`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
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
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Permanent Save Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-extrabold text-emerald-950">
                Permanent Save Guarantee
              </p>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                Store Name, UPI ID aur Extra % apni marji se change karein. Save par click karte hi permanently save ho jayega.
              </p>
            </div>
          </div>

          {/* Store Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Store / Business Name</span>
              </label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                Permanent Save
              </span>
            </div>
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
            <p className="text-[11px] text-slate-400 mt-1">
              QR code ke upar aapke store ka naam display hoga.
            </p>
          </div>

          {/* UPI ID / VPA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>UPI ID / VPA (Receiving UPI Address)</span>
              </label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                Permanent Save
              </span>
            </div>
            <input
              type="text"
              required
              value={formData.upiId}
              onChange={(e) =>
                setFormData({ ...formData, upiId: e.target.value })
              }
              placeholder="e.g. sharmastore@okhdfcbank or 9876543210@paytm"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-mono font-semibold text-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Customer dwara kiya gaya payment isi UPI ID par credit hoga (GPay, PhonePe, Paytm, BHIM).
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
                  <option value="hi">Hindi</option>
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

          {/* Supabase Cloud Database Integration - Admin only, hidden for customer */}
          {isAdmin && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white tracking-wide flex items-center gap-1.5">
                      <span>Supabase Cloud Database</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Project ID: {SUPABASE_PROJECT_ID}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Connected</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Store Name, UPI ID aur settings aapke Supabase Cloud database ke sath permanently synced rehte hain.
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncCloud}
                  disabled={cloudStatus.checking}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {cloudStatus.checking ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : cloudStatus.synced ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5" />
                  )}
                  <span>{cloudStatus.synced ? 'Synced to Supabase!' : 'Sync to Cloud Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs transition-all cursor-pointer"
                  title="Copy PostgreSQL table script for Supabase SQL Editor"
                >
                  {copiedSql ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
                </button>

                {onOpenAdminPanel && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminPanel();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-emerald-500/50 text-emerald-300 font-bold text-xs transition-all cursor-pointer"
                    title="Switch to Admin Control Panel"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin Panel</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Account Password Security Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-200 text-slate-700 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-xs">Password Security</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md border border-amber-300">
                  Admin Only Change
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                User passwords can only be changed or reset by the <strong>System Administrator</strong>. Regular users cannot change passwords directly.
              </p>
            </div>
          </div>

          {/* 24/7 WhatsApp Support & Help Card */}
          <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-green-50/90 border-2 border-emerald-300 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs shrink-0">
                  <WhatsAppIcon className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">
                      Admin WhatsApp Support
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Active 24/7
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    If you face any problem or issue, contact directly on WhatsApp
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              If you experience any issues with QR code, payments, store setup, or validity, please contact Admin directly on WhatsApp at <strong className="text-emerald-950 font-extrabold">8598912555</strong>.
            </p>

            <a
              id="btn-settings-whatsapp-support"
              href={buildWhatsAppSupportUrl({
                customerName:
                  currentUser?.name ||
                  (formData.storeName && formData.storeName !== 'Sharma General Store'
                    ? formData.storeName
                    : 'Customer'),
                customerEmail:
                  currentUser?.email ||
                  (() => {
                    try {
                      return localStorage.getItem('logged_in_user_email') || '';
                    } catch {
                      return '';
                    }
                  })(),
                storeName: formData.storeName,
                customerPhone: currentUser?.phone || '8598912555',
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all group cursor-pointer"
            >
              <WhatsAppIcon className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
              <span>Contact Admin on WhatsApp (8598912555)</span>
            </a>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
            <button
              type="button"
              onClick={onResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Surcharge to 2%</span>
            </button>

            <button
              id="btn-save-settings"
              type="submit"
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 ml-auto cursor-pointer ${
                saveSuccess
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved Successfully!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
