import logger from './utils/logger.js';
import { initializeWhatsApp, disconnectWhatsApp, isWhatsAppReady } from './notifications/whatsappService.js';
import { scheduleDailyNotification, runPromotionCheck, getNextRunTime } from './scheduler/cronJobs.js';
import { formatTestMessage } from './notifications/messageFormatter.js';
import { sendToAllRecipients } from './notifications/whatsappService.js';
import { generateQRCodeImage, getQRCodeDataUrl } from './notifications/qrCodeServer.js';

import express from 'express';
import http from 'http';

/**
 * Main application entry point
 */
async function main() {
    // Create Express app for QR Code and health checks
    const app = express();
    const port = process.env.PORT || 8080;

    // Serve static files
    app.use(express.static('public'));

    // QR Code page route
    app.get('/', (req, res) => {
        const qrCode = getQRCodeDataUrl();
        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Livelo Bot - QR Code WhatsApp</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }

        .header {
            margin-bottom: 30px;
        }

        .header h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header p {
            color: #666;
            font-size: 14px;
        }

        .qr-container {
            background: #f5f5f5;
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
        }

        .qr-container img {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .loading {
            color: #667eea;
            font-size: 16px;
            font-weight: 500;
        }

        .instructions {
            background: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: left;
        }

        .instructions h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 16px;
        }

        .instructions ol {
            color: #666;
            font-size: 14px;
            margin-left: 20px;
            line-height: 1.8;
        }

        .instructions li {
            margin-bottom: 8px;
        }

        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            font-size: 14px;
        }

        .status.ready {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .status.waiting {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }

        .footer {
            margin-top: 30px;
            color: #999;
            font-size: 12px;
        }

        .emoji {
            font-size: 24px;
            margin-right: 10px;
        }

        @media (max-width: 600px) {
            .container {
                padding: 20px;
            }

            .header h1 {
                font-size: 22px;
            }

            .qr-container {
                padding: 20px;
                min-height: 300px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><span class="emoji">📱</span>Livelo Bot</h1>
            <p>Escaneie o QR Code para conectar ao WhatsApp</p>
        </div>

        <div class="qr-container" id="qrContainer">
            ${qrCode ? `<img src="${qrCode}" alt="QR Code WhatsApp" />` : '<div class="loading">⏳ Gerando QR Code...</div>'}
        </div>

        <div class="instructions">
            <h3>Como fazer:</h3>
            <ol>
                <li>Abra o WhatsApp no seu celular</li>
                <li>Vá para <strong>Configurações → Dispositivos Conectados</strong></li>
                <li>Clique em <strong>Conectar um dispositivo</strong></li>
                <li>Escaneie o QR Code acima com a câmera do seu celular</li>
                <li>Aguarde a conexão ser estabelecida</li>
            </ol>
        </div>

        <div class="status waiting" id="status">
            ⏳ Aguardando escaneamento do QR Code...
        </div>

        <div class="footer">
            <p>O QR Code expira em 5 minutos. Se expirar, atualize a página.</p>
        </div>
    </div>

    <script>
        // Auto-refresh QR Code every 5 minutes
        setTimeout(() => {
            location.reload();
        }, 300000);

        // Check status every 2 seconds
        setInterval(() => {
            fetch('/api/status')
                .then(res => res.json())
                .then(data => {
                    const statusEl = document.getElementById('status');
                    if (data.ready) {
                        statusEl.className = 'status ready';
                        statusEl.textContent = '✅ WhatsApp conectado com sucesso!';
                    } else {
                        statusEl.className = 'status waiting';
                        statusEl.textContent = '⏳ Aguardando escaneamento do QR Code...';
                    }
                })
                .catch(err => console.error('Erro ao verificar status:', err));
        }, 2000);
    </script>
</body>
</html>
        `;
        res.send(html);
    });

    // API route to get QR Code image
    app.get('/api/qrcode', (req, res) => {
        const qrCode = getQRCodeDataUrl();
        if (qrCode) {
            res.json({ qrCode });
        } else {
            res.status(404).json({ error: 'QR Code not yet generated' });
        }
    });

    // API route to check status
    app.get('/api/status', (req, res) => {
        res.json({ ready: isWhatsAppReady() });
    });

    // Health check route
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', whatsapp: isWhatsAppReady() });
    });

    // Start server
    const server = app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
        console.log(`\n🌐 Acesse: http://localhost:${port}\n`);
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
