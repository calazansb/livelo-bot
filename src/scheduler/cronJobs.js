import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import { scrapeLiveloPromotions } from '../scraper/liveloScraper.js';
import { loadCurrentPromotions, saveCurrentPromotions, detectChanges, addToHistory } from '../storage/promotionStore.js';
import { sendToAllRecipients } from '../notifications/whatsappService.js';
import { formatDailySummary, formatNewPromotionsAlert } from '../notifications/messageFormatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, '../../config.json');
const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

/**
 * Main job: Scrape promotions and send notifications
 */
export async function runPromotionCheck() {
    try {
        logger.info('========================================');
        logger.info('Starting scheduled promotion check...');
        logger.info('========================================');

        // Scrape current promotions
        const newPromotions = await scrapeLiveloPromotions();

        if (newPromotions.length === 0) {
            logger.warn('No promotions found during scraping');
        }

        // Load previous promotions
        const oldPromotions = await loadCurrentPromotions();

        // Detect changes
        const changes = detectChanges(oldPromotions, newPromotions);

        logger.info(`Changes detected: ${changes.new.length} new, ${changes.expired.length} expired, ${changes.updated.length} updated`);

        // Save new promotions
        await saveCurrentPromotions(newPromotions);

        // Add to history
        await addToHistory(newPromotions);

        // Send notifications
        if (changes.new.length > 0) {
            // Send alert for new promotions
            logger.info('Sending alert for new promotions...');
            const alertMessage = formatNewPromotionsAlert(changes.new);
            await sendToAllRecipients(alertMessage);

            // Wait a bit before sending summary
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Always send daily summary
        logger.info('Sending daily summary...');
        const summaryMessage = formatDailySummary(newPromotions, changes);
        await sendToAllRecipients(summaryMessage);

        logger.info('========================================');
        logger.info('Promotion check completed successfully');
        logger.info('========================================');

    } catch (error) {
        logger.error(`Error in promotion check: ${error.message}`);
        logger.error(error.stack);
    }
}

/**
 * Schedule daily notification at noon (Brazil time)
 */
export function scheduleDailyNotification() {
    const cronExpression = config.schedule.cronExpression;
    const timezone = config.schedule.timezone;

    logger.info(`Scheduling daily notification: ${cronExpression} (${timezone})`);

    const task = cron.schedule(cronExpression, async () => {
        logger.info('Cron job triggered');
        await runPromotionCheck();
    }, {
        scheduled: true,
        timezone: timezone
    });

    logger.info('Daily notification scheduled successfully');

    return task;
}

/**
 * Schedule periodic checks (optional - every 6 hours)
 */
export function schedulePeriodicChecks() {
    // Run every 6 hours: 0 */6 * * *
    const cronExpression = '0 */6 * * *';
    const timezone = config.schedule.timezone;

    logger.info(`Scheduling periodic checks: ${cronExpression} (${timezone})`);

    const task = cron.schedule(cronExpression, async () => {
        logger.info('Periodic check triggered');
        await runPromotionCheck();
    }, {
        scheduled: true,
        timezone: timezone
    });

    logger.info('Periodic checks scheduled successfully');

    return task;
}

/**
 * Get next scheduled run time
 */
export function getNextRunTime() {
    const cronExpression = config.schedule.cronExpression;
    const now = new Date();

    // Simple calculation for daily noon schedule
    const next = new Date(now);
    next.setHours(12, 0, 0, 0);

    // If noon has passed today, schedule for tomorrow
    if (now.getHours() >= 12) {
        next.setDate(next.getDate() + 1);
    }

    return next;
}
