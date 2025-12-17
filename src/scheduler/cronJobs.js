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
    const timezone = config.schedule.timezone;
    // Explicitly define the schedules
    const schedules = [
        '0 8 * * *',  // 08:00
        '0 14 * * *', // 14:00
        '0 20 * * *'  // 20:00
    ];

    logger.info(`Scheduling ${schedules.length} daily notifications (${timezone})`);

    schedules.forEach(expression => {
        logger.info(`Scheduling job: ${expression}`);
        cron.schedule(expression, async () => {
            logger.info(`⏰ Cron job triggered: ${expression}`);
            await runPromotionCheck();
        }, {
            scheduled: true,
            timezone: timezone
        });
    });

    logger.info('Daily notifications scheduled successfully');
}

/**
 * Schedule periodic checks (optional - every 6 hours)
 */
export function schedulePeriodicChecks() {
    // Disabled in favor of explicit daily notifications
    logger.info('Periodic checks disabled in favor of fixed schedule');
}

/**
 * Debug: Heartbeat to verify scheduler is alive
 */
export function scheduleHeartbeat() {
    // Run every 10 minutes
    const cronExpression = '*/10 * * * *';
    const timezone = config.schedule.timezone;

    logger.info(`Scheduling heartbeat: ${cronExpression}`);

    cron.schedule(cronExpression, () => {
        const now = new Date();
        logger.info(`💓 Heartbeat: Scheduler is alive. Time: ${now.toLocaleString('pt-BR', { timeZone: timezone })}`);
    }, {
        scheduled: true,
        timezone: timezone
    });
}

/**
 * Get next scheduled run time
 */
export function getNextRunTime() {
    const now = new Date();
    // Use target hours from the requirement: 8, 14, 20
    const scheduledHours = [8, 14, 20];

    // Find the next hour in the list that is after current hour
    const nextHour = scheduledHours.find(h => h > now.getHours());

    const next = new Date(now);

    if (nextHour !== undefined) {
        // Found a run for today
        next.setHours(nextHour, 0, 0, 0);
    } else {
        // No more runs today, schedule for first slot tomorrow
        next.setDate(next.getDate() + 1);
        next.setHours(scheduledHours[0], 0, 0, 0);
    }

    return next;
}
