import QRCode from "qrcode";

export async function generateMerchantQR(merchantId: string) {
  const payload = `kobklein://pay?merchantId=${merchantId}`;

  const dataUrl = await QRCode.toDataURL(payload);

  return dataUrl;
}