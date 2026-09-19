import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck } from 'lucide-react';
import { MerchantConfig } from '../types';

interface UpiCardProps {
  config: MerchantConfig;
  finalAmount: number;
  baseAmount: number;
}

export const UpiCard: React.FC<UpiCardProps> = ({
  config,
  finalAmount,
  baseAmount,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Generate NPCI compliant UPI payment string
  const upiUrl = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set('pa', config.upiId.trim());
    params.set('pn', config.storeName.trim());
    params.set('cu', 'INR');
    if (finalAmount > 0) {
      params.set('am', finalAmount.toFixed(2));
    }
    if (config.note) {
      params.set('tn', config.note.trim());
    }
    return `upi://pay?${params.toString()}`;
  }, [config.upiId, config.storeName, config.note, finalAmount]);

  return (
    <div
      ref={cardRef}
      id="main-upi-card"
      className="bg-white rounded-[26px] border-2 border-emerald-200/90 shadow-sm p-4 sm:p-5 flex flex-col items-center w-full transition-all duration-200 hover:shadow-md"
    >
      {/* Top Banner: BHIM UPI and Accepted Here */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 text-slate-800">
          <span className="font-extrabold text-[15px] sm:text-base tracking-wide text-emerald-950">
            BHIM UPI
          </span>
          <ShieldCheck className="w-5 h-5 text-emerald-600 stroke-[2.4]" />
        </div>

        <span className="bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-bold px-3 py-1 rounded-lg">
          Accepted Here
        </span>
      </div>

      {/* Store Information */}
      <div className="text-center mb-4 px-2">
        <h2 className="font-bold text-[19px] sm:text-xl text-slate-900 leading-tight">
          {config.storeName || 'Sharma General Store'}
        </h2>
        <p className="text-slate-500 text-[13px] sm:text-sm mt-0.5 tracking-tight font-medium select-all">
          {config.upiId || 'sharmastore@okhdfcbank'}
        </p>
      </div>

      {/* QR Code Container matching screenshot */}
      <div className="relative p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs flex flex-col items-center justify-center my-1 group">
        <div className="relative bg-white p-1 rounded-xl">
          <QRCodeSVG
            value={upiUrl}
            size={236}
            level="H"
            includeMargin={false}
            className="w-[220px] h-[220px] sm:w-[240px] sm:h-[240px] rounded-lg"
          />

          {/* Center UPI Badge as seen in the photo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white border-2 border-slate-200/80 px-2 py-0.5 rounded-md shadow-md flex items-center justify-center">
              <span className="text-[11px] font-black tracking-wider text-slate-800">
                UPI
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Amount Pill below QR if amount > 0 */}
        {finalAmount > 0 && (
          <div className="mt-3 py-1 px-3 bg-emerald-50 border border-emerald-300 rounded-full flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-xs text-slate-600 font-medium">QR Amount:</span>
            <span className="text-sm font-extrabold text-emerald-800">
              ₹{finalAmount % 1 === 0 ? finalAmount : finalAmount.toFixed(2)}
            </span>
            {config.isExtraEnabled && config.extraPercentage > 0 && (
              <span className="text-[11px] font-semibold text-emerald-600">
                (₹{baseAmount} + {config.extraPercentage}%)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
