import QRCode from 'qrcode';
import logger from '../utils/logger.js';

let qrCodeDataUrl = null;

/**
 * Generate and store QR Code as data URL
 */
export async function generateQRCodeImage(qrData) {
    try {
        qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: 1,
            width: 300,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        logger.info('QR Code image generated successfully');
        return qrCodeDataUrl;
    } catch (error) {
        logger.error(`Error generating QR Code image: ${error.message}`);
        throw error;
    }
}

/**
 * Get QR Code data URL
 */
export function getQRCodeDataUrl() {
    return qrCodeDataUrl;
}
