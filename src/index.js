import logger from './utils/logger.js';
import { initializeWhatsApp, disconnectWhatsApp, isWhatsAppReady } from './notifications/whatsappService.js';
import { scheduleDailyNotification, runPromotionCheck, getNextRunTime } from './scheduler/cronJobs.js';
import { formatTestMessage } from './notifications/messageFormatter.js';
import { sendToAllRecipients } from './notifications/whatsappService.js';

import http from 'http';

/**
 * Main application entry point
 */
async function main() {
    // Start dummy server for Railway/Cloud health checks
    const port = process.env.PORT || 8080;
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end('Livelo Bot is running!');
    });
    server.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });

    try {
        console.log('\n');
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                                                            ║');
        console.log('║        LIVELO PROMOTION TRACKER - WhatsApp Bot             ║');
        console.log('║                                                            ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log('\n');

        logger.info('Starting Livelo Promotion Tracker...');

        // Initialize WhatsApp
        logger.info('Step 1: Initializing WhatsApp connection...');
        console.log('\n📱 Inicializando conexão com WhatsApp...\n');

        await initializeWhatsApp();

        console.log('\n✅ WhatsApp conectado com sucesso!\n');

        // Send test message
        logger.info('Step 2: Sending test message...');
        console.log('📤 Enviando mensagem de teste...\n');

        const testMessage = formatTestMessage();
        await sendToAllRecipients(testMessage);

        console.log('✅ Mensagem de teste enviada!\n');

        // Setup message handler for commands
        logger.info('Step 3: Setting up message handler...');
        console.log('💬 Configurando resposta a comandos WhatsApp...\n');

        const { setupMessageHandler } = await import('./notifications/messageHandler.js');
        await setupMessageHandler();

        console.log('✅ Handler de mensagens configurado!\n');
        console.log('💡 Você pode enviar comandos via WhatsApp:\n');
        console.log('   • "verificar" - Consultar promoções agora\n');
        console.log('   • "status" - Ver status do sistema\n');
        console.log('   • "ajuda" - Ver todos os comandos\n');

        // Schedule daily notifications
        logger.info('Step 4: Scheduling daily notifications...');
        console.log('⏰ Configurando notificações diárias...\n');

        scheduleDailyNotification();

        const nextRun = getNextRunTime();
        console.log(`✅ Notificações agendadas para todos os dias às 12:00 (horário de Brasília)`);
        console.log(`📅 Próxima execução: ${nextRun.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);

        // Optional: Run initial check
        const args = process.argv.slice(2);
        if (args.includes('--run-now')) {
            logger.info('Running initial promotion check...');
            console.log('🔍 Executando verificação inicial de promoções...\n');
            await runPromotionCheck();
            console.log('\n✅ Verificação inicial concluída!\n');
        }

        // Keep the application running
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                                                            ║');
        console.log('║  🟢 Sistema ativo e monitorando promoções Livelo          ║');
        console.log('║                                                            ║');
        console.log('║  Pressione Ctrl+C para encerrar                           ║');
        console.log('║                                                            ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log('\n');

        logger.info('Application is running. Press Ctrl+C to stop.');

    } catch (error) {
        logger.error(`Fatal error: ${error.message}`);
        console.error('\n❌ Erro fatal:', error.message);
        console.error('\nVerifique os logs em logs/error.log para mais detalhes.\n');
        process.exit(1);
    }
}

/**
 * Graceful shutdown handler
 */
async function shutdown() {
    console.log('\n\n🛑 Encerrando aplicação...\n');
    logger.info('Shutting down gracefully...');

    try {
        await disconnectWhatsApp();
        logger.info('Application stopped successfully');
        console.log('✅ Aplicação encerrada com sucesso.\n');
        process.exit(0);
    } catch (error) {
        logger.error(`Error during shutdown: ${error.message}`);
        process.exit(1);
    }
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception: ${error.message}`);
    logger.error(error.stack);
    shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled rejection at: ${promise}, reason: ${reason}`);
    shutdown();
});

// Start the application
main();
