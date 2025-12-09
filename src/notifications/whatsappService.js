import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import { generateQRCodeImage } from './qrCodeServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, '../../config.json');
const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

let whatsappClient = null;
let isClientReady = false;
let currentQRCode = null;
let currentAuthCode = null;

/**
 * Extract authentication code from QR code string
 */
function extractAuthCode(qrString) {
    try {
        // QR code format: https://web.whatsapp.com/qr/...
        // Extract the code part after /qr/
        const match = qrString.match(/qr\/([^,]+)/);
        if (match && match[1]) {
            return match[1];
        }
        return qrString.substring(0, 50) + '...'; // Fallback: return first 50 chars
    } catch (error) {
        logger.error(`Error extracting auth code: ${error.message}`);
        return null;
    }
}

/**
 * Initialize WhatsApp client
 */
export async function initializeWhatsApp() {
    return new Promise((resolve, reject) => {
        try {
            logger.info('Initializing WhatsApp client...');

            whatsappClient = new Client({
                authStrategy: new LocalAuth({
                    dataPath: '.wwebjs_auth'
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--single-process',
                        '--no-first-run',
                        '--no-default-browser-check',
                        '--disable-default-apps',
                        '--disable-popup-blocking',
                        '--disable-translate',
                        '--disable-background-networking',
                        '--disable-breakpad',
                        '--disable-client-side-phishing-detection',
                        '--disable-component-extensions-with-background-pages',
                        '--disable-default-apps',
                        '--disable-extensions',
                        '--disable-features=TranslateUI',
                        '--disable-hang-monitor',
                        '--disable-ipc-flooding-protection',
                        '--disable-popup-blocking',
                        '--disable-prompt-on-repost',
                        '--disable-renderer-backgrounding',
                        '--disable-sync',
                        '--enable-automation',
                        '--export-tagged-pdf',
                        '--metrics-recording-only',
                        '--mute-audio',
                        '--no-default-browser-check',
                        '--no-first-run',
                        '--password-store=basic',
                        '--use-mock-keychain'
                    ]
                }
            });

            // QR Code event
            whatsappClient.on('qr', async (qr) => {
                logger.info('QR Code received. Scan with your phone:');
                
                // Store QR code and extract auth code
                currentQRCode = qr;
                currentAuthCode = extractAuthCode(qr);
                
                logger.info(`📱 Código de autenticação: ${currentAuthCode}`);
                logger.info(`🔗 Link direto: https://web.whatsapp.com/qr/${currentAuthCode}`);
                
                // Generate QR Code image
                try {
                    await generateQRCodeImage(qr);
                    console.log('\n✅ QR Code gerado com sucesso!');
                    console.log('📱 Abra o navegador em: http://localhost:8080');
                    console.log('   Ou acesse a URL do Railway para escanear o QR Code');
                    console.log(`\n🔗 Alternativa (sem QR Code):`);
                    console.log(`   Link direto: https://web.whatsapp.com/qr/${currentAuthCode}`);
                    console.log(`   Código: ${currentAuthCode}\n`);
                } catch (error) {
                    logger.error(`Error generating QR Code image: ${error.message}`);
                    // Fallback to terminal QR Code
                    qrcode.generate(qr, { small: true });
                    console.log('\n📱 Abra o WhatsApp no seu celular e escaneie o QR code acima');
                    console.log(`\n🔗 Ou use este link direto: https://web.whatsapp.com/qr/${currentAuthCode}\n`);
                }
            });

            // Ready event
            whatsappClient.on('ready', () => {
                logger.info('WhatsApp client is ready!');
                isClientReady = true;
                resolve(whatsappClient);
            });

            // Authenticated event
            whatsappClient.on('authenticated', () => {
                logger.info('WhatsApp authenticated successfully');
            });

            // Authentication failure
            whatsappClient.on('auth_failure', (msg) => {
                logger.error(`WhatsApp authentication failed: ${msg}`);
                reject(new Error('Authentication failed'));
            });

            // Disconnected event
            whatsappClient.on('disconnected', (reason) => {
                logger.warn(`WhatsApp disconnected: ${reason}`);
                isClientReady = false;
            });

            // Initialize
            whatsappClient.initialize();

            // Timeout after 5 minutes if not authenticated
            const timeoutId = setTimeout(() => {
                if (!isClientReady) {
                    logger.error('WhatsApp initialization timeout');
                    reject(new Error('Initialization timeout'));
                }
            }, 300000);
            
            // Store original resolve to clear timeout
            const originalResolve = resolve;
            resolve = (client) => {
                clearTimeout(timeoutId);
                originalResolve(client);
            };

        } catch (error) {
            logger.error(`Error initializing WhatsApp: ${error.message}`);
            reject(error);
        }
    });
}

/**
 * Get current QR code
 */
export function getCurrentQRCode() {
    return currentQRCode;
}

/**
 * Get current authentication code
 */
export function getCurrentAuthCode() {
    return currentAuthCode;
}

/**
 * Send message to a phone number
 */
export async function sendMessage(phoneNumber, message) {
    try {
        if (!isClientReady) {
            logger.error('WhatsApp client is not ready');
            return false;
        }

        // Format phone number (remove special characters)
        const formattedNumber = phoneNumber.replace(/[^\d]/g, '');

        // Add country code if not present
        const chatId = formattedNumber.includes('@c.us')
            ? formattedNumber
            : `${formattedNumber}@c.us`;

        logger.info(`Sending message to ${phoneNumber}...`);

        await whatsappClient.sendMessage(chatId, message);

        logger.info(`Message sent successfully to ${phoneNumber}`);
        return true;

    } catch (error) {
        logger.error(`Error sending message to ${phoneNumber}: ${error.message}`);
        return false;
    }
}

/**
 * Send message to all configured recipients
 */
export async function sendToAllRecipients(message) {
    const recipients = config.whatsapp.recipients;
    const results = [];

    logger.info(`Sending message to ${recipients.length} recipient(s)...`);

    for (const recipient of recipients) {
        const success = await sendMessage(recipient, message);
        results.push({ recipient, success });

        // Add small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const successCount = results.filter(r => r.success).length;
    logger.info(`Sent to ${successCount}/${recipients.length} recipients successfully`);

    return results;
}

/**
 * Check if WhatsApp client is ready
 */
export function isWhatsAppReady() {
    return isClientReady;
}

/**
 * Get WhatsApp client instance
 */
export function getWhatsAppClient() {
    return whatsappClient;
}

/**
 * Gracefully disconnect WhatsApp client
 */
export async function disconnectWhatsApp() {
    if (whatsappClient) {
        logger.info('Disconnecting WhatsApp client...');
        await whatsappClient.destroy();
        isClientReady = false;
        logger.info('WhatsApp client disconnected');
    }
}
