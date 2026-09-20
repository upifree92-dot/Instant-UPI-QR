import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AcceptedUpiAppsProps {
  compact?: boolean;
}

export const AcceptedUpiApps: React.FC<AcceptedUpiAppsProps> = () => {
  const apps = [
    'phonepe',
    'gpay',
    'paytm',
    'bhim',
    'amazon pay',
    'whatsapp',
    'cred',
    'all upi',
  ];

  return (
    <div className="w-full mt-2 pt-2 border-t border-slate-100 flex flex-col items-center text-center">
      {/* Small micro chips */}
      <div className="flex flex-wrap items-center justify-center gap-1 w-full max-w-xs px-1">
        {apps.map((app) => (
          <span
            key={app}
            className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200/60 text-[9.5px] font-medium text-slate-500 tracking-tight lowercase select-none"
          >
            {app}
          </span>
        ))}
      </div>

      {/* Tiny trust line */}
      <div className="mt-1.5 flex items-center justify-center gap-1 text-[9px] text-slate-400 font-normal">
        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
        <span>accepts all upi apps &bull; 0% fee</span>
      </div>
    </div>
  );
};
