export interface MerchantConfig {
  storeName: string;
  upiId: string;
  extraPercentage: number;
  isExtraEnabled: boolean;
  currency: string;
  note: string;
  soundboxVoice: boolean;
  language: 'hi' | 'en';
}

export interface PresetAmount {
  id: string;
  baseAmount: number;
}
