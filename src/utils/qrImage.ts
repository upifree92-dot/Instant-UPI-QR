import { MerchantConfig } from '../types';

/**
 * Generate a PNG blob of the QR card with store name, amount, and UPI info
 */
export async function generateQrImageBlob(
  upiUrl: string,
  config: MerchantConfig,
  finalAmount: number,
  baseAmount: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      // Create an offscreen canvas
      const canvas = document.createElement('canvas');
      const width = 600;
      const height = 750;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      // Background rounded card
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Top Header bar
      ctx.fillStyle = '#047857';
      ctx.fillRect(0, 0, width, 110);

      // BHIM UPI banner text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BHIM UPI  |  Accepted Here', width / 2, 65);

      // Store Name
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(config.storeName || 'Store Name', width / 2, 175);

      // UPI ID
      ctx.fillStyle = '#64748b';
      ctx.font = '22px monospace';
      ctx.fillText(config.upiId, width / 2, 215);

      // Amount Display if > 0
      if (finalAmount > 0) {
        ctx.fillStyle = '#ecfdf5';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        const pillWidth = 320;
        const pillHeight = 56;
        const pillX = (width - pillWidth) / 2;
        const pillY = 245;
        
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 28);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 28px sans-serif';
        const displayAmt = finalAmount % 1 === 0 ? finalAmount : finalAmount.toFixed(2);
        ctx.fillText(`Amount to Pay: ₹${displayAmt}`, width / 2, pillY + 38);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('Scan & Pay Any Amount', width / 2, 280);
      }

      // Draw QR code
      const img = new Image();
      // Generate QR code using quick Google Charts or SVG data URI / Canvas
      const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        upiUrl
      )}`;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const qrSize = 300;
        const qrX = (width - qrSize) / 2;
        const qrY = 325;
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

        // Center UPI Badge
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(width / 2 - 35, qrY + qrSize / 2 - 18, 70, 36, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('UPI', width / 2, qrY + qrSize / 2 + 6);

        // Supported Apps Footer
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, height - 75, width, 75);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(
          'Scan & Pay With Any UPI App',
          width / 2,
          height - 32
        );

        canvas.toBlob((blob) => resolve(blob), 'image/png');
      };
      img.onerror = () => {
        // Fallback resolve without external image if blocked
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      };
      img.src = qrDataUrl;
    } catch {
      resolve(null);
    }
  });
}
