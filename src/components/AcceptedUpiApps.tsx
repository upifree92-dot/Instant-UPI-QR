import React from 'react';
import { ShieldCheck, CheckCircle2, Zap } from 'lucide-react';

interface AcceptedUpiAppsProps {
  compact?: boolean;
}

export const AcceptedUpiApps: React.FC<AcceptedUpiAppsProps> = ({ compact = false }) => {
  const upiApps = [
    {
      id: 'phonepe',
      name: 'PhonePe',
      subtitle: 'पे',
      color: '#5f259f',
      bgLight: '#f5f0fb',
      border: '#e4d3f5',
      badge: (
        <div className="w-7 h-7 rounded-xl bg-[#5f259f] flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
            <path d="M19.5 7.5h-8v2.5h3c2 0 3.2 1 3.2 2.8 0 1.8-1.2 2.8-3.2 2.8h-3v5h-2.5v-13h10.5V7.5zm-5 4h-3v2.2h3c.8 0 1.3-.4 1.3-1.1 0-.7-.5-1.1-1.3-1.1z" />
          </svg>
        </div>
      ),
    },
    {
      id: 'gpay',
      name: 'Google Pay',
      subtitle: 'GPay',
      color: '#1a73e8',
      bgLight: '#f0f6ff',
      border: '#d2e3fc',
      badge: (
        <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs shrink-0 p-1">
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path
              d="M10.8 12.2v2.5h-2.5V5.5h4.2c1.1 0 2 .4 2.7 1.1.7.7 1.1 1.6 1.1 2.7 0 1.1-.4 2-1.1 2.7-.7.7-1.6 1.1-2.7 1.1h-1.7v-.9zm0-5.1v3.5h1.7c.6 0 1.1-.2 1.5-.6.4-.4.6-.9.6-1.5 0-.6-.2-1.1-.6-1.5-.4-.4-.9-.6-1.5-.6h-1.7v.7z"
              fill="#4285F4"
            />
            <path
              d="M19.2 8.4c1.1 0 2 .3 2.7 1 .7.6 1 1.5 1 2.6v4.7h-2.3v-1.1h-.1c-.6.9-1.4 1.3-2.5 1.3-.9 0-1.7-.3-2.3-.8-.6-.5-.9-1.2-.9-2.1 0-.9.3-1.6 1-2.1.7-.5 1.6-.8 2.7-.8.9 0 1.7.2 2.3.5v-.4c0-.6-.2-1-.6-1.4-.4-.4-.9-.6-1.5-.6-.9 0-1.6.4-2.1 1.1l-1.9-1.2c.9-1.3 2.3-2 4-2zm-1.8 6.4c0 .4.2.7.5.9.3.2.7.4 1.2.4.6 0 1.1-.2 1.6-.6.5-.4.7-.9.7-1.5-.5-.4-1.2-.6-2-.6-.6 0-1.1.1-1.5.4-.3.2-.5.5-.5 1z"
              fill="#34A853"
            />
          </svg>
        </div>
      ),
    },
    {
      id: 'paytm',
      name: 'Paytm',
      subtitle: 'UPI',
      color: '#002970',
      bgLight: '#eef8fe',
      border: '#c8ebfc',
      badge: (
        <div className="w-7 h-7 rounded-xl bg-[#002970] flex items-center justify-center shadow-xs shrink-0 px-0.5">
          <span className="text-[9px] font-black tracking-tight text-white flex items-center">
            <span>Pay</span>
            <span className="text-[#00BAF2]">tm</span>
          </span>
        </div>
      ),
    },
    {
      id: 'bhim',
      name: 'BHIM UPI',
      subtitle: 'NPCI',
      color: '#097939',
      bgLight: '#f2f9f4',
      border: '#cdebd6',
      badge: (
        <div className="w-7 h-7 rounded-xl bg-white border border-emerald-300 flex items-center justify-center shadow-xs shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path d="M7 4l7 8-7 8" stroke="#EE741E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M12 4l7 8-7 8" stroke="#097939" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      ),
    },
    {
      id: 'amazon',
      name: 'Amazon Pay',
      subtitle: 'amazon',
      color: '#ff9900',
      bgLight: '#fff9ee',
      border: '#fde5b6',
      badge: (
        <div className="w-7 h-7 rounded-xl bg-[#232F3E] flex items-center justify-center shadow-xs shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path
              d="M5 14c4 2.5 10 2.5 14 0-1 1.2-2.5 2-4.5 2.3-4 .5-8-.3-11-2.3"
              stroke="#FF9900"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M19 13.5l1.5 1.5-2 .5" fill="#FF9900" />
          </svg>
        </div>
      ),
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      subtitle: 'Pay',
      color: '#25d366',
      bgLight: '#effcf4',
      border: '#c4f6d6',
      badge: (
        <div className="w-7 h-7 rounded-xl bg-[#25D366] flex items-center justify-center shadow-xs shrink-0 text-white">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 17.72c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a7.868 7.868 0 0 1-1.2-4.15c0-4.4 3.58-7.98 7.99-7.98 2.14 0 4.14.83 5.65 2.35 1.51 1.51 2.34 3.52 2.34 5.65 0 4.4-3.58 7.98-7.99 7.98z" />
          </svg>
        </div>
      ),
    },
    {
      id: 'cred',
      name: 'CRED UPI',
      subtitle: 'CRED',
      color: '#0f172a',
      bgLight: '#f8fafc',
      border: '#e2e8f0',
      badge: (
        <div className="w-7 h-7 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs shrink-0 border border-slate-800">
          <span className="text-[8px] font-black tracking-widest text-white">CRED</span>
        </div>
      ),
    },
    {
      id: 'banks',
      name: '100+ Banks',
      subtitle: 'SBI, HDFC..',
      color: '#0284c7',
      bgLight: '#f0f9ff',
      border: '#bae6fd',
      badge: (
        <div className="w-7 h-7 rounded-xl bg-sky-600 flex items-center justify-center shadow-xs shrink-0 text-white font-bold text-[10px]">
          <Zap className="w-3.5 h-3.5" />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full mt-3 pt-3 border-t border-slate-100 flex flex-col items-center">
      {/* Top Banner: Accepted Here Heading */}
      <div className="w-full flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-slate-800 tracking-tight">
            Scan & Pay with Any UPI App
          </span>
        </div>
        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>All UPI Accepted</span>
        </span>
      </div>

      {/* Grid of Logos (PhonePe, Google Pay, Paytm, BHIM, Amazon Pay, WhatsApp Pay, Cred, Banks) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full">
        {upiApps.map((app) => (
          <div
            key={app.id}
            className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border transition-all hover:scale-103 hover:shadow-2xs select-none"
            style={{
              backgroundColor: app.bgLight,
              borderColor: app.border,
            }}
          >
            {app.badge}
            <span className="text-[11px] font-extrabold text-slate-900 mt-1 text-center truncate max-w-full leading-tight">
              {app.name}
            </span>
            <span className="text-[9px] font-bold text-slate-500 leading-none mt-0.5">
              {app.subtitle}
            </span>
          </div>
        ))}
      </div>

      {/* Trust & Interoperability NPCI Bar */}
      <div className="mt-2.5 pt-2 border-t border-slate-100/80 w-full flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Instant Sound Alert &bull; 0% Fee &bull; 100% Secure NPCI Network</span>
      </div>
    </div>
  );
};
