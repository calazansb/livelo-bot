import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const CURRENT_PROMOTIONS_FILE = path.join(DATA_DIR, 'current_promotions.json');
const PROMOTION_HISTORY_FILE = path.join(DATA_DIR, 'promotion_history.json');

/**
 * Ensure data directory exists
 */
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        logger.error(`Error creating data directory: ${error.message}`);
    }
}

/**
 * Load current promotions from file
 */
export async function loadCurrentPromotions() {
    await ensureDataDir();
    try {
        const data = await fs.readFile(CURRENT_PROMOTIONS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            logger.info('No existing promotions file found, starting fresh');
            return [];
        }
        logger.error(`Error loading current promotions: ${error.message}`);
        return [];
    }
}

/**
 * Save current promotions to file
 */
export async function saveCurrentPromotions(promotions) {
    await ensureDataDir();
    try {
        await fs.writeFile(
            CURRENT_PROMOTIONS_FILE,
            JSON.stringify(promotions, null, 2),
            'utf-8'
        );
        logger.info(`Saved ${promotions.length} promotions to storage`);
    } catch (error) {
        logger.error(`Error saving current promotions: ${error.message}`);
    }
}

/**
 * Load promotion history
 */
export async function loadPromotionHistory() {
    await ensureDataDir();
    try {
        const data = await fs.readFile(PROMOTION_HISTORY_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        logger.error(`Error loading promotion history: ${error.message}`);
        return [];
    }
}

/**
 * Add promotions to history
 */
export async function addToHistory(promotions) {
    await ensureDataDir();
    try {
        const history = await loadPromotionHistory();
        const timestamp = new Date().toISOString();

        const historyEntry = {
            timestamp,
            promotions
        };

        history.push(historyEntry);

        // Keep only last 100 entries
        const trimmedHistory = history.slice(-100);

        await fs.writeFile(
            PROMOTION_HISTORY_FILE,
            JSON.stringify(trimmedHistory, null, 2),
            'utf-8'
        );

        logger.info('Added promotions to history');
    } catch (error) {
        logger.error(`Error adding to history: ${error.message}`);
    }
}

/**
 * Compare promotions and detect changes
 */
export function detectChanges(oldPromotions, newPromotions) {
    const changes = {
        new: [],
        expired: [],
        updated: []
    };

    // Create maps for easier comparison
    const oldMap = new Map(oldPromotions.map(p => [p.id, p]));
    const newMap = new Map(newPromotions.map(p => [p.id, p]));

    // Find new promotions
    for (const [id, promo] of newMap) {
        if (!oldMap.has(id)) {
            changes.new.push(promo);
        } else {
            // Check if promotion was updated
            const oldPromo = oldMap.get(id);
            if (JSON.stringify(oldPromo) !== JSON.stringify(promo)) {
                changes.updated.push(promo);
            }
        }
    }

    // Find expired promotions
    for (const [id, promo] of oldMap) {
        if (!newMap.has(id)) {
            changes.expired.push(promo);
        }
    }

    return changes;
}
