import logger from '../utils/logger.js';

/**
 * Format date in Brazilian format (DD/MM/YYYY)
 */
function formatDateBR(dateString) {
    if (!dateString) return 'Sem prazo definido';

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

/**
 * Format points with thousand separators
 */
function formatPoints(points) {
    if (!points) return 'Não especificado';
    return points.toLocaleString('pt-BR');
}

/**
 * Check if promotion is expiring soon (within 7 days)
 */
function isExpiringSoon(dateString) {
    if (!dateString) return false;

    const expiryDate = new Date(dateString);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
}

/**
 * Format a single promotion
 */
function formatSinglePromotion(promotion, isNew = false, isExpiring = false) {
    const emoji = isNew ? '🆕 ' : isExpiring ? '⚠️ ' : '✈️ ';
    const status = isNew ? ' *[NOVA]*' : isExpiring ? ' *[EXPIRA EM BREVE]*' : '';

    let message = `${emoji}*${promotion.airline}*${status}\n`;

    if (promotion.bonusPercentage) {
        message += `💰 Bônus: *${promotion.bonusPercentage}%*\n`;
    }

    if (promotion.minimumPoints) {
        message += `📊 Mínimo: ${formatPoints(promotion.minimumPoints)} pontos\n`;
    }

    message += `📅 Válido até: ${formatDateBR(promotion.validUntil)}\n`;

    if (promotion.link) {
        message += `🔗 ${promotion.link}\n`;
    }

    return message;
}

/**
 * Format daily summary message
 */
export function formatDailySummary(promotions, changes = null) {
    logger.info('Formatting daily summary message');

    let message = '🔔 *PROMOÇÕES LIVELO - TRANSFERÊNCIA DE PONTOS*\n\n';
    message += `📊 Total de promoções ativas: *${promotions.length}*\n\n`;

    if (promotions.length === 0) {
        message += '😔 Nenhuma promoção ativa no momento.\n';
        message += 'Fique ligado! Novas promoções podem surgir a qualquer momento.\n';
        return message;
    }

    // Show new promotions first
    if (changes && changes.new.length > 0) {
        message += '🆕 *NOVAS PROMOÇÕES*\n';
        message += '━━━━━━━━━━━━━━━━\n';
        changes.new.forEach(promo => {
            message += formatSinglePromotion(promo, true, false);
            message += '\n';
        });
    }

    // Show expiring promotions
    const expiringPromotions = promotions.filter(p => isExpiringSoon(p.validUntil));
    if (expiringPromotions.length > 0) {
        message += '⚠️ *EXPIRANDO EM BREVE*\n';
        message += '━━━━━━━━━━━━━━━━\n';
        expiringPromotions.forEach(promo => {
            message += formatSinglePromotion(promo, false, true);
            message += '\n';
        });
    }

    // Show all active promotions grouped by airline
    message += '✈️ *TODAS AS PROMOÇÕES ATIVAS*\n';
    message += '━━━━━━━━━━━━━━━━\n';

    // Group by airline
    const byAirline = {};
    promotions.forEach(promo => {
        if (!byAirline[promo.airline]) {
            byAirline[promo.airline] = [];
        }
        byAirline[promo.airline].push(promo);
    });

    // Sort airlines alphabetically
    const sortedAirlines = Object.keys(byAirline).sort();

    sortedAirlines.forEach(airline => {
        const airlinePromos = byAirline[airline];
        airlinePromos.forEach(promo => {
            message += formatSinglePromotion(promo, false, false);
            message += '\n';
        });
    });

    // Add footer
    message += '━━━━━━━━━━━━━━━━\n';
    message += `🕐 Atualizado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`;
    message += '🌐 https://www.livelo.com.br\n';

    return message;
}

/**
 * Format alert for new promotions only
 */
export function formatNewPromotionsAlert(newPromotions) {
    logger.info(`Formatting alert for ${newPromotions.length} new promotions`);

    let message = '🎉 *ALERTA: NOVAS PROMOÇÕES LIVELO!*\n\n';
    message += `${newPromotions.length} nova(s) promoção(ões) detectada(s)!\n\n`;

    newPromotions.forEach(promo => {
        message += formatSinglePromotion(promo, true, false);
        message += '\n';
    });

    message += '━━━━━━━━━━━━━━━━\n';
    message += `🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`;

    return message;
}

/**
 * Format simple test message
 */
export function formatTestMessage() {
    return '✅ *Teste de Conexão WhatsApp*\n\nO sistema de notificações Livelo está funcionando corretamente!';
}
