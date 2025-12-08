import logger from '../utils/logger.js';
import { getWhatsAppClient } from './whatsappService.js';
import { scrapeLiveloPromotions } from '../scraper/liveloScraper.js';
import { loadCurrentPromotions, saveCurrentPromotions, detectChanges } from '../storage/promotionStore.js';
import { formatDailySummary, formatNewPromotionsAlert } from './messageFormatter.js';

/**
 * Process incoming WhatsApp messages and respond to commands
 */
export async function setupMessageHandler() {
    const client = getWhatsAppClient();

    if (!client) {
        logger.warn('WhatsApp client not available for message handler');
        return;
    }

    logger.info('Setting up WhatsApp message handler...');

    // Listen to ALL messages (including self-messages)
    client.on('message_create', async (message) => {
        try {
            const messageText = message.body.toLowerCase().trim();
            const chatId = message.from;
            const isGroup = chatId.includes('@g.us');
            const fromMe = message.fromMe;

            logger.info(`Received message from ${chatId} (group: ${isGroup}, fromMe: ${fromMe}): "${messageText}"`);

            // Ignore group messages but ACCEPT self-messages (fromMe)
            if (isGroup) {
                logger.info(`Ignoring group message from ${chatId}`);
                return;
            }

            // Accept messages from anyone in direct chat OR messages from yourself
            logger.info(`Processing message: "${messageText}" (fromMe: ${fromMe})`);

            // Command: Check promotions now
            if (messageText === 'verificar' || messageText === 'consultar' || messageText === 'promoções' || messageText === 'promocoes') {
                logger.info(`Matched 'verificar' command`);
                await handleCheckPromotions(client, chatId);
            }
            // Command: Help
            else if (messageText === 'ajuda' || messageText === 'help' || messageText === 'comandos') {
                logger.info(`Matched 'ajuda' command`);
                await handleHelp(client, chatId);
            }
            // Command: Status
            else if (messageText === 'status') {
                logger.info(`Matched 'status' command`);
                await handleStatus(client, chatId);
            }
            else {
                logger.info(`No command matched for: "${messageText}"`);
            }

        } catch (error) {
            logger.error(`Error handling message: ${error.message}`);
            logger.error(error.stack);
        }
    });

    logger.info('WhatsApp message handler configured successfully');
}

/**
 * Handle "verificar" command - check promotions immediately
 */
async function handleCheckPromotions(client, chatId) {
    try {
        logger.info(`Processing 'verificar' command from ${chatId}`);

        // Send acknowledgment
        await client.sendMessage(chatId, '🔍 *Verificando promoções Livelo...*\n\nAguarde alguns segundos...');

        // Scrape promotions
        const newPromotions = await scrapeLiveloPromotions();

        // Load previous promotions
        const oldPromotions = await loadCurrentPromotions();

        // Detect changes
        const changes = detectChanges(oldPromotions, newPromotions);

        // Save new promotions
        await saveCurrentPromotions(newPromotions);

        // Send results
        if (changes.new.length > 0) {
            const alertMessage = formatNewPromotionsAlert(changes.new);
            await client.sendMessage(chatId, alertMessage);

            // Wait a bit before sending summary
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const summaryMessage = formatDailySummary(newPromotions, changes);
        await client.sendMessage(chatId, summaryMessage);

        logger.info(`Successfully sent promotion check results to ${chatId}`);

    } catch (error) {
        logger.error(`Error in handleCheckPromotions: ${error.message}`);
        await client.sendMessage(chatId, '❌ Erro ao verificar promoções. Tente novamente mais tarde.');
    }
}

/**
 * Handle "ajuda" command - show available commands
 */
async function handleHelp(client, chatId) {
    const helpMessage = `
📱 *COMANDOS DISPONÍVEIS*

🔍 *verificar* ou *consultar*
   Verifica promoções Livelo agora mesmo

📊 *status*
   Mostra status do sistema

❓ *ajuda*
   Mostra esta mensagem

━━━━━━━━━━━━━━━━━━━━━━
💡 *Dica*: Você também receberá notificações automáticas todos os dias às 12h!
`;

    await client.sendMessage(chatId, helpMessage);
    logger.info(`Sent help message to ${chatId}`);
}

/**
 * Handle "status" command - show system status
 */
async function handleStatus(client, chatId) {
    try {
        const promotions = await loadCurrentPromotions();
        const now = new Date();
        const nextRun = new Date(now);
        nextRun.setHours(12, 0, 0, 0);

        if (now.getHours() >= 12) {
            nextRun.setDate(nextRun.getDate() + 1);
        }

        const statusMessage = `
📊 *STATUS DO SISTEMA*

🟢 Sistema: *Ativo*
📱 WhatsApp: *Conectado*

✈️ Promoções salvas: *${promotions.length}*
${promotions.length > 0 ? promotions.map(p => `   • ${p.airline}: ${p.bonusPercentage}%`).join('\n') : '   Nenhuma promoção ativa'}

⏰ Próxima verificação:
   ${nextRun.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

━━━━━━━━━━━━━━━━━━━━━━
💡 Digite *verificar* para consultar agora!
`;

        await client.sendMessage(chatId, statusMessage);
        logger.info(`Sent status message to ${chatId}`);

    } catch (error) {
        logger.error(`Error in handleStatus: ${error.message}`);
        await client.sendMessage(chatId, '❌ Erro ao obter status.');
    }
}
