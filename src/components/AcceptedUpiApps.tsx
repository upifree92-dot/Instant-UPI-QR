import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AcceptedUpiAppsProps {
  compact?: boolean;
}

export const AcceptedUpiApps: React.FC<AcceptedUpiAppsProps> = ({ compact = false }) => {
  const apps = [
    'phonepe',
    'google pay',
    'paytm',
    'bhim',
    'amazon pay',
    'whatsapp pay',
    'cred',
    'all upi',
  ];

  return (
    <div className="w-full mt-3 pt-2.5 border-t border-slate-100 flex flex-col items-center text-center">
      {/* Status indicator */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>accepted via any upi app</span>
      </div>

      {/* Small letters chips without logos */}
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 w-full max-w-sm px-1">
        {apps.map((app) => (
          <span
            key={app}
            className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-[11px] font-medium text-slate-600 tracking-tight lowercase transition-colors select-none"
          >
            {app}
          </span>
        ))}
      </div>

      {/* Trust & Interoperability footer */}
      <div className="mt-2 pt-1.5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>zero fee &bull; 100% secure npci transfer</span>
      </div>
    </div>
  );
};
