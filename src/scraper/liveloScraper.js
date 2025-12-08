import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import { parsePromotions } from './promotionParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, '../../config.json');
const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

/**
 * Scrape Livelo website for transfer promotions
 */
export async function scrapeLiveloPromotions() {
    let browser;

    try {
        logger.info('Starting Livelo promotion scraper...');

        // Launch browser
        browser = await puppeteer.launch({
            headless: config.scraping.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set user agent to avoid detection
        await page.setUserAgent(config.scraping.userAgent);

        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });

        logger.info(`Navigating to ${config.livelo.baseUrl}...`);

        // Navigate to Livelo homepage
        await page.goto(config.livelo.baseUrl, {
            waitUntil: 'networkidle2',
            timeout: config.scraping.timeout
        });

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        logger.info('Searching for transfer promotions...');

        // Try to find and click on the "Viagens" or "Trocar pontos" menu
        const promotions = await scrapeFromMultipleSources(page);

        await browser.close();

        logger.info(`Scraping completed. Found ${promotions.length} raw promotions`);

        // Parse the promotions
        const parsedPromotions = parsePromotions(promotions);

        return parsedPromotions;

    } catch (error) {
        // Handle common Puppeteer errors gracefully
        if (error.message.includes('Execution context was destroyed')) {
            logger.warn('Page navigation interrupted scraping - this is normal, will retry next time');
        } else if (error.message.includes('Navigation timeout')) {
            logger.warn('Page took too long to load - will retry next time');
        } else {
            logger.error(`Error scraping Livelo: ${error.message}`);
        }

        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                logger.warn('Error closing browser, ignoring');
            }
        }
        return [];
    }
}

/**
 * Scrape from multiple sources on the Livelo website
 */
async function scrapeFromMultipleSources(page) {
    const allPromotions = [];

    // Strategy 1: Search for transfer-related content
    try {
        const searchPromotions = await scrapeFromSearch(page);
        allPromotions.push(...searchPromotions);
    } catch (error) {
        logger.warn(`Search scraping failed: ${error.message}`);
    }

    // Strategy 2: Navigate to specific sections
    try {
        const menuPromotions = await scrapeFromMenu(page);
        allPromotions.push(...menuPromotions);
    } catch (error) {
        logger.warn(`Menu scraping failed: ${error.message}`);
    }

    // Strategy 3: Look for promotion banners on homepage
    try {
        const bannerPromotions = await scrapePromotionBanners(page);
        allPromotions.push(...bannerPromotions);
    } catch (error) {
        logger.warn(`Banner scraping failed: ${error.message}`);
    }

    // Remove duplicates based on title
    const uniquePromotions = Array.from(
        new Map(allPromotions.map(p => [p.title, p])).values()
    );

    return uniquePromotions;
}

/**
 * Scrape using search functionality
 */
async function scrapeFromSearch(page) {
    logger.info('Attempting to scrape from search...');

    // Click search button
    await page.click('button[aria-label*="Buscar"], button[aria-label*="Search"], .search-button, #search-button').catch(() => { });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Type search query
    await page.keyboard.type('transferir pontos companhias aereas');
    await page.keyboard.press('Enter');

    // Wait for results
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract promotion data from search results
    try {
        const promotions = await page.evaluate(() => {
            const results = [];

            // Look for links and cards that mention airlines or transfers
            const elements = document.querySelectorAll('a, .card, .promotion, .offer, [class*="promo"]');

            elements.forEach(el => {
                const text = el.textContent || '';
                const href = el.href || '';

                // Check if element mentions airlines or bonuses
                if (text.match(/latam|azul|smiles|flying blue|united|tap|iberia|british|aeromexico|etihad|gol|bônus|bonus|transferir|milhas/i)) {
                    results.push({
                        title: el.querySelector('h1, h2, h3, h4, .title, [class*="title"]')?.textContent?.trim() || text.substring(0, 100),
                        description: text.trim(),
                        link: href
                    });
                }
            });

            return results;
        });

        logger.info(`Found ${promotions.length} promotions from search`);
        return promotions;
    } catch (error) {
        logger.warn(`Error extracting search results: ${error.message}`);
        return [];
    }
}

/**
 * Scrape from navigation menu
 */
async function scrapeFromMenu(page) {
    logger.info('Attempting to scrape from menu...');

    const promotions = [];

    // Try to click "Viagens" menu
    try {
        await page.click('a:has-text("Viagens"), button:has-text("Viagens")').catch(() => { });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Look for transfer-related links
        const menuPromotions = await page.evaluate(() => {
            const results = [];
            const links = document.querySelectorAll('a');

            links.forEach(link => {
                const text = link.textContent || '';
                if (text.match(/transferir.*pontos|companhias.*aéreas/i)) {
                    results.push({
                        title: text.trim(),
                        description: text.trim(),
                        link: link.href
                    });
                }
            });

            return results;
        });

        promotions.push(...menuPromotions);
    } catch (error) {
        logger.warn(`Menu navigation failed: ${error.message}`);
    }

    return promotions;
}

/**
 * Scrape promotion banners from homepage
 */
async function scrapePromotionBanners(page) {
    logger.info('Scraping promotion banners (waiting for auto-rotation)...');

    const allPromotions = [];
    const seenLinks = new Set();

    try {
        // Function to extract banners from current view
        const extractCurrentBanners = async () => {
            return await page.evaluate(() => {
                const results = [];

                // Helper to check if element is visible
                const isVisible = (elem) => {
                    if (!elem) return false;
                    const style = window.getComputedStyle(elem);
                    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
                };

                // Target the main carousel container specifically
                // We look for the container that has the "Próximo Slide" button
                const nextButton = document.querySelector('button[aria-label="Próximo Slide"]');
                let carouselContainer = null;

                if (nextButton) {
                    carouselContainer = nextButton.parentElement;
                }

                // Strategy: Look for ALL links in the carousel container that are visible
                if (carouselContainer) {
                    const links = carouselContainer.querySelectorAll('a');
                    links.forEach(link => {
                        if (isVisible(link)) {
                            const img = link.querySelector('img');
                            const text = link.textContent.trim();
                            const altText = img ? img.alt : '';
                            const title = link.querySelector('h1, h2, h3, h4, .title')?.textContent?.trim() || '';

                            // Combine text sources for better matching
                            const fullText = `${title} ${text} ${altText}`;

                            if (fullText.match(/latam|azul|smiles|flying blue|united|tap|iberia|british|aeromexico|etihad|transferir|bônus|bonus|milhas|pontos/i)) {
                                results.push({
                                    title: title || altText || text.substring(0, 100).trim(),
                                    description: fullText.trim(),
                                    link: link.href
                                });
                            }
                        }
                    });
                }

                // Fallback: Look for other banner-like elements if main carousel didn't yield much
                // This covers other carousels or static banners on the page
                const banners = document.querySelectorAll(
                    '.banner, .promo, .promotion, .offer, .campaign, [class*="banner"], [class*="promo"], [class*="destaque"], [class*="slide"]'
                );

                banners.forEach(banner => {
                    if (!isVisible(banner)) return;

                    // Avoid re-scraping what we just found in the main carousel if possible, 
                    // but simple deduplication later handles this.

                    const text = banner.textContent || '';
                    const link = banner.querySelector('a')?.href || banner.closest('a')?.href || '';
                    const img = banner.querySelector('img');
                    const altText = img ? img.alt : '';

                    if ((text + altText).match(/latam|azul|smiles|flying blue|united|tap|iberia|british|aeromexico|etihad|transferir|bônus|bonus|milhas|pontos/i)) {
                        const title = banner.querySelector('h1, h2, h3, h4, .title')?.textContent?.trim() || '';

                        results.push({
                            title: title || altText || text.substring(0, 100).trim(),
                            description: (text + ' ' + altText).trim(),
                            link: link
                        });
                    }
                });

                return results;
            });
        };

        // Polling loop: Wait for carousel to rotate
        // Livelo carousel usually rotates every ~5 seconds. 
        // We'll watch for 60 seconds to ensure we catch a full cycle (usually ~5-10 slides).
        const pollingDuration = 60000; // 60 seconds
        const pollingInterval = 4000;  // Check every 4 seconds
        const startTime = Date.now();

        logger.info(`Starting passive scrape for ${pollingDuration / 1000} seconds...`);

        // Move mouse away from center to avoid hovering and pausing the carousel
        await page.mouse.move(0, 0);

        while (Date.now() - startTime < pollingDuration) {
            const newPromotions = await extractCurrentBanners();

            for (const p of newPromotions) {
                // Create a unique key for deduplication
                const key = `${p.title}|${p.link}`;
                if (!seenLinks.has(key)) {
                    seenLinks.add(key);
                    allPromotions.push(p);
                    // logger.info(`Found new banner: ${p.title}`); // Optional: verbose logging
                }
            }

            // Wait for next rotation
            await new Promise(resolve => setTimeout(resolve, pollingInterval));
        }

        logger.info(`Found ${allPromotions.length} unique promotions from banners after waiting`);
        return allPromotions;

    } catch (error) {
        logger.warn(`Error extracting banners: ${error.message}`);
        return allPromotions;
    }
}

/**
 * Main function for testing
 */

