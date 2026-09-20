import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Wifi,
  BatteryCharging,
  RotateCcw,
  Sparkles,
  Radio,
  Sliders,
} from 'lucide-react';
import { MerchantConfig } from '../types';

interface SoundboxCardProps {
  config: MerchantConfig;
  currentAmount: number;
  onTriggerVoice: (amountToAnnounce: number) => void;
  onToggleLanguage?: () => void;
}

export const SoundboxCard: React.FC<SoundboxCardProps> = ({
  config,
  currentAmount,
  onTriggerVoice,
  onToggleLanguage,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState<'high' | 'med' | 'mute'>('high');

  const displayAmount = currentAmount > 0 ? currentAmount : 102;

  const handlePlaySoundbox = () => {
    setIsPlaying(true);
    onTriggerVoice(displayAmount);
    setTimeout(() => {
      setIsPlaying(false);
    }, 3200);
  };

  const cycleVolume = () => {
    if (volumeLevel === 'high') setVolumeLevel('med');
    else if (volumeLevel === 'med') setVolumeLevel('mute');
    else setVolumeLevel('high');
  };

  return (
    <div
      id="counter-soundbox-device"
      className="w-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-[26px] p-4 text-white shadow-xl border-2 border-slate-700/80 overflow-hidden relative"
    >
      {/* Glossy top edge highlight */}
      <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

      {/* Top Device Status Bar (4G, Battery, Online LED) */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3 text-[11px] text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          {/* Active Status LED */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold text-emerald-400 tracking-wider">
              ONLINE 4G
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>VoLTE</span>
          </div>
        </div>

        {/* Device Brand Header */}
        <div className="flex items-center gap-1 font-black text-xs tracking-wider text-slate-300">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>SMART SOUNDBOX</span>
        </div>

        {/* Battery Indicator */}
        <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
          <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          <span>98%</span>
        </div>
      </div>

      {/* Main Body: Digital Display & Speaker Grill */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        {/* Left: Glowing Digital Screen */}
        <div className="bg-slate-950 rounded-2xl p-3.5 border border-emerald-500/30 shadow-inner flex flex-col justify-between relative overflow-hidden">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:12px_12px] opacity-10 pointer-events-none" />

          <div className="flex items-center justify-between text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider mb-1">
            <span>Payment Received</span>
            <span className="text-slate-400 font-mono">
              {config.language === 'hi' ? 'Hindi Voice' : 'English Voice'}
            </span>
          </div>

          {/* LED Digits */}
          <div className="py-1">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-400 font-mono drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]">
              ₹{displayAmount.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
              {config.storeName}
            </p>
          </div>

          {/* Status ticker */}
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Ready to Announce
            </span>
            <span className="font-mono">NPCI UPI</span>
          </div>
        </div>

        {/* Right: Speaker Grill & Play Button */}
        <div className="flex flex-col items-center justify-center p-2">
          {/* Circular Speaker Grill */}
          <div className="relative flex items-center justify-center mb-2">
            {/* Animated Audio Ripples when playing */}
            {isPlaying && (
              <>
                <div className="absolute w-24 h-24 rounded-full border border-emerald-400/40 animate-ping" />
                <div className="absolute w-20 h-20 rounded-full border border-emerald-500/50 animate-pulse" />
              </>
            )}

            {/* Central Speaker Disc */}
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center shadow-md relative group">
              {/* Micro speaker grill dots pattern */}
              <div className="absolute inset-2 rounded-full border border-slate-700/60 bg-[radial-gradient(#475569_1.5px,transparent_1.5px)] [background-size:6px_6px] opacity-40" />

              <Volume2
                className={`w-7 h-7 text-emerald-400 transition-transform ${
                  isPlaying ? 'scale-115 animate-bounce' : 'group-hover:scale-105'
                }`}
              />
            </div>
          </div>

          {/* Hardware Action Buttons */}
          <div className="w-full flex items-center gap-1.5">
            <button
              id="btn-soundbox-play"
              type="button"
              onClick={handlePlaySoundbox}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-700/40 transition-all cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
              <span>
                Play Voice (₹{displayAmount})
              </span>
            </button>

            {/* Volume Toggle Button */}
            <button
              type="button"
              onClick={cycleVolume}
              title={`Volume: ${volumeLevel}`}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 transition-colors border border-slate-700"
            >
              {volumeLevel === 'high' && <Volume2 className="w-4 h-4 text-emerald-400" />}
              {volumeLevel === 'med' && <Volume1 className="w-4 h-4 text-yellow-400" />}
              {volumeLevel === 'mute' && <VolumeX className="w-4 h-4 text-rose-400" />}
            </button>

            {/* Language Quick Toggle */}
            {onToggleLanguage && (
              <button
                type="button"
                onClick={onToggleLanguage}
                title="Toggle Soundbox Voice Language"
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-300 transition-colors border border-slate-700"
              >
                {config.language === 'en' ? 'EN' : 'HI'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
