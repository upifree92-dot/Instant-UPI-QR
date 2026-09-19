import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { MerchantConfig } from '../types';
import { generateQrImageBlob } from '../utils/qrImage';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MerchantConfig;
  finalAmount: number;
  baseAmount: number;
  upiUrl: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  config,
  finalAmount,
  baseAmount,
  upiUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const displayAmount =
    finalAmount > 0
      ? finalAmount % 1 === 0
        ? finalAmount
        : finalAmount.toFixed(2)
      : null;

  const shareText = displayAmount
    ? `*Payment Request from ${config.storeName}*\n💰 *Amount: ₹${displayAmount}*\n\n👉 Click the link to pay instantly using Google Pay, PhonePe, Paytm or BHIM UPI:\n${upiUrl}`
    : `*UPI Payment Request from ${config.storeName}*\n\n👉 Pay to UPI ID: *${config.upiId}*\nClick to pay:\n${upiUrl}`;

  // WhatsApp direct share link
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    shareText
  )}`;

  // Copy payment link
  const handleCopy = () => {
    navigator.clipboard.writeText(upiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Native share (supports sharing file or text)
  const handleNativeShare = async () => {
    try {
      setIsGenerating(true);
      const blob = await generateQrImageBlob(
        upiUrl,
        config,
        finalAmount,
        baseAmount
      );
      setIsGenerating(false);

      if (blob && navigator.canShare) {
        const file = new File([blob], `UPI-QR-${finalAmount || 'pay'}.png`, {
          type: 'image/png',
        });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Pay ₹${finalAmount || ''} to ${config.storeName}`,
            text: shareText,
            files: [file],
          });
          return;
        }
      }

      if (navigator.share) {
        await navigator.share({
          title: `Pay ₹${finalAmount || ''} to ${config.storeName}`,
          text: shareText,
          url: upiUrl,
        });
      } else {
        window.open(whatsappUrl, '_blank');
      }
    } catch {
      // User cancelled or share unavailable
      setIsGenerating(false);
    }
  };

  // Download QR image
  const handleDownload = async () => {
    setIsGenerating(true);
    const blob = await generateQrImageBlob(
      upiUrl,
      config,
      finalAmount,
      baseAmount
    );
    setIsGenerating(false);

    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UPI-QR-${config.storeName.replace(/\s+/g, '-')}-${
        finalAmount || 'general'
      }.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Share QR & Payment
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {finalAmount > 0
                  ? `Selected Amount: ₹${displayAmount}`
                  : 'Open UPI payment without fixed amount'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5">
          {/* Amount Badge */}
          {finalAmount > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Amount To Be Sent
                </span>
                <span className="text-2xl font-black text-emerald-900">
                  ₹{displayAmount}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-600 block">
                  {config.storeName}
                </span>
                <span className="text-[11px] font-mono text-slate-400 block truncate max-w-[140px]">
                  {config.upiId}
                </span>
              </div>
            </div>
          )}

          {/* Share on WhatsApp Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-sm active:scale-98 transition-all"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>
              Share on WhatsApp {finalAmount > 0 ? `(₹${displayAmount})` : ''}
            </span>
          </a>

          {/* System Share (All Apps) */}
          <button
            type="button"
            onClick={handleNativeShare}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm active:scale-98 transition-all disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>
              {isGenerating ? 'Preparing QR Card...' : 'Share to Other Apps'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Download Image */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Save QR Image</span>
            </button>

            {/* Copy UPI Link */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copy UPI Link</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Customer opens link & pays directly via their UPI app</span>
          </div>
        </div>
      </div>
    </div>
  );
};
