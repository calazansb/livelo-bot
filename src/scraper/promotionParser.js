import logger from '../utils/logger.js';

/**
 * Parse promotion text to extract bonus percentage
 * Examples: "40% de bônus", "110% bônus", "até 90% de bônus"
 */
function extractBonusPercentage(text) {
    const bonusMatch = text.match(/(\d+)%\s*(de\s*)?bônus/i);
    if (bonusMatch) {
        return parseInt(bonusMatch[1]);
    }
    return null;
}

/**
 * Parse date strings in Portuguese format
 * Examples: "até 01/08/2025", "válido até 30/09/2025"
 */
function extractValidityDate(text) {
    // Match DD/MM/YYYY format
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
        const [, day, month, year] = dateMatch;
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    }
    return null;
}

/**
 * Extract minimum points requirement
 * Examples: "mínimo de 10.000 pontos", "a partir de 15.000 pontos"
 */
function extractMinimumPoints(text) {
    const pointsMatch = text.match(/(\d+\.?\d*)\s*(mil|k|pontos)/i);
    if (pointsMatch) {
        let points = parseFloat(pointsMatch[1].replace('.', ''));
        if (pointsMatch[2].toLowerCase() === 'mil' || pointsMatch[2].toLowerCase() === 'k') {
            points *= 1000;
        }
        return points;
    }
    return null;
}

/**
 * Identify airline from text
 */
function identifyAirline(text) {
    const airlines = {
        'LATAM': ['latam', 'latam pass'],
        'Azul': ['azul', 'azul fidelidade', 'tudoazul'],
        'Smiles': ['smiles', 'gol'],
        'Flying Blue': ['flying blue', 'air france', 'klm'],
        'United': ['united', 'mileageplus', 'mileage plus'],
        'TAP': ['tap', 'miles&go', 'miles and go'],
        'Iberia': ['iberia', 'avios'],
        'British Airways': ['british airways', 'ba executive club'],
        'Aeromexico': ['aeromexico', 'club premier'],
        'Etihad': ['etihad', 'guest']
    };

    const lowerText = text.toLowerCase();

    for (const [airline, keywords] of Object.entries(airlines)) {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
            return airline;
        }
    }

    return 'Unknown';
}

/**
 * Generate unique ID for promotion
 */
function generatePromotionId(airline, bonus, validUntil) {
    const dateStr = validUntil ? validUntil.toISOString().split('T')[0] : 'ongoing';
    return `${airline.toLowerCase().replace(/\s+/g, '-')}-${bonus || 0}-${dateStr}`;
}

/**
 * Parse raw promotion data into structured format
 */
export function parsePromotion(rawData) {
    try {
        const { title, description, link } = rawData;
        const fullText = `${title} ${description}`;

        const airline = identifyAirline(fullText);
        const bonusPercentage = extractBonusPercentage(fullText);
        const validUntil = extractValidityDate(fullText);
        const minimumPoints = extractMinimumPoints(fullText);

        const promotion = {
            id: generatePromotionId(airline, bonusPercentage, validUntil),
            airline,
            bonusPercentage,
            validUntil: validUntil ? validUntil.toISOString() : null,
            minimumPoints,
            title: title.trim(),
            description: description.trim(),
            link,
            scrapedAt: new Date().toISOString()
        };

        logger.info(`Parsed promotion: ${airline} - ${bonusPercentage}% bonus`);
        return promotion;
    } catch (error) {
        logger.error(`Error parsing promotion: ${error.message}`);
        return null;
    }
}

/**
 * Parse multiple promotions
 */
export function parsePromotions(rawPromotions) {
    const parsed = rawPromotions
        .map(parsePromotion)
        .filter(p => p !== null && p.airline !== 'Unknown');

    logger.info(`Successfully parsed ${parsed.length} promotions`);
    return parsed;
}

/**
 * Check if promotion is still valid
 */
export function isPromotionValid(promotion) {
    if (!promotion.validUntil) {
        return true; // No expiry date means ongoing
    }

    const expiryDate = new Date(promotion.validUntil);
    const now = new Date();

    return expiryDate > now;
}

/**
 * Filter only valid promotions
 */
export function filterValidPromotions(promotions) {
    return promotions.filter(isPromotionValid);
}
