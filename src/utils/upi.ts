import { MerchantConfig } from '../types';

export function buildUpiPayUrl(config: MerchantConfig, amount: number): string {
  const params = new URLSearchParams();
  params.append('pa', config.upiId);
  params.append('pn', config.storeName);
  params.append('cu', config.currency || 'INR');
  if (config.note) {
    params.append('tn', config.note);
  }
  if (amount > 0) {
    const formattedAmount =
      amount % 1 === 0 ? amount.toFixed(2) : amount.toFixed(2);
    params.append('am', formattedAmount);
  }
  return `upi://pay?${params.toString()}`;
}
