import React from 'react';
import { Settings, RefreshCw, LogOut, QrCode, Globe } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onReset: () => void;
  onExit: () => void;
  language?: 'hi' | 'en';
  onToggleLanguage?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onReset,
  onExit,
  language = 'en',
  onToggleLanguage,
}) => {
  return (
    <header className="flex items-center justify-between py-3 px-3 sm:px-4 bg-transparent max-w-md mx-auto w-full">
      {/* Left branding */}
      <div className="flex items-center gap-2.5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20">
          <QrCode className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-extrabold text-[17px] text-slate-900 tracking-tight">
            Instant UPI
          </span>
          <span className="font-extrabold text-[17px] text-slate-900 tracking-tight">
            QR Generator
          </span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {onToggleLanguage && (
          <button
            id="btn-toggle-lang"
            type="button"
            onClick={onToggleLanguage}
            title={language === 'en' ? 'Switch to Hindi (हिन्दी)' : 'Switch to English'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2]" />
            <span>{language === 'en' ? 'EN' : 'HI'}</span>
          </button>
        )}

        <button
          id="btn-settings"
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-400 bg-emerald-50/80 text-emerald-800 font-bold text-sm hover:bg-emerald-100/80 active:scale-95 transition-all shadow-xs"
        >
          <Settings className="w-4 h-4 stroke-[2.2] text-emerald-700 animate-spin-slow" />
          <span>Settings</span>
        </button>

        <button
          id="btn-refresh"
          type="button"
          onClick={onReset}
          title="Reset to 0"
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:scale-95 transition-all shadow-xs flex items-center justify-center"
        >
          <RefreshCw className="w-4 h-4 stroke-[2]" />
        </button>

        <button
          id="btn-exit"
          type="button"
          onClick={onExit}
          title="Clear / Reset All"
          className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 active:scale-95 transition-all shadow-xs flex items-center justify-center"
        >
          <LogOut className="w-4 h-4 stroke-[2]" />
        </button>
      </div>
    </header>
  );
};
