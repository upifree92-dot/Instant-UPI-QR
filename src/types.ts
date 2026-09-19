export type UserRole = 'merchant' | 'admin' | 'customer';

export type ValidityPlan = '1_month' | '3_months' | '6_months' | '1_year' | 'lifetime';

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  businessName?: string;
  role: UserRole;
  status: 'active' | 'pending' | 'rejected';
  validityPlan?: ValidityPlan;
  validUntil?: string; // ISO date string
  validFrom?: string; // ISO date string
  registeredAt: string;
  isNotificationRead: boolean;
}

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

export interface TransactionRecord {
  id: string;
  baseAmount: number;
  finalAmount: number;
  surchargeAmount: number;
  timestamp: string;
  storeName: string;
  upiId: string;
}
