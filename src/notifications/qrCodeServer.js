import express from 'express';
import QRCode from 'qrcode';
import logger from '../utils/logger.js';

let qrCodeDataUrl = null;
let app = null;
let server = null;

/**
 * Initialize QR Code server
 */
export async function initializeQRCodeServer(port = 3000) {
    return new Promise((resolve, reject) => {
        try {
            app = express();

            // Serve static files
            app.use(express.static('public'));

            // QR Code page route
            app.get('/', (req, res) => {
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
            <div class="loading">⏳ Gerando QR Code...</div>
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
                if (qrCodeDataUrl) {
                    res.json({ qrCode: qrCodeDataUrl });
                } else {
                    res.status(404).json({ error: 'QR Code not yet generated' });
                }
            });

            // API route to check status
            app.get('/api/status', (req, res) => {
                res.json({ ready: false }); // This will be updated by whatsappService
            });

            // Start server
            server = app.listen(port, () => {
                logger.info(`QR Code server started on port ${port}`);
                console.log(`\n🌐 QR Code disponível em: http://localhost:${port}\n`);
                resolve(app);
            });

        } catch (error) {
            logger.error(`Error initializing QR Code server: ${error.message}`);
            reject(error);
        }
    });
}

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

/**
 * Stop QR Code server
 */
export async function stopQRCodeServer() {
    if (server) {
        return new Promise((resolve) => {
            server.close(() => {
                logger.info('QR Code server stopped');
                resolve();
            });
        });
    }
}
