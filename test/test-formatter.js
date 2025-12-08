import { formatDailySummary, formatNewPromotionsAlert } from '../src/notifications/messageFormatter.js';

console.log('Testing Message Formatter...\n');

// Sample promotions
const promotions = [
    {
        id: 'latam-30-2025-02-24',
        airline: 'LATAM',
        bonusPercentage: 30,
        validUntil: '2025-02-24T00:00:00.000Z',
        minimumPoints: 15000,
        title: 'Transferência para LATAM Pass com 30% de bônus',
        description: 'Transfira seus pontos Livelo para LATAM Pass e ganhe 30% de bônus.',
        link: 'https://www.livelo.com.br/latam'
    },
    {
        id: 'azul-110-2025-09-30',
        airline: 'Azul',
        bonusPercentage: 110,
        validUntil: '2025-09-30T00:00:00.000Z',
        minimumPoints: null,
        title: 'Azul Fidelidade - até 110% de bônus',
        description: 'Promoção especial para Clube Livelo.',
        link: 'https://www.livelo.com.br/azul'
    },
    {
        id: 'flying-blue-40-2025-12-14',
        airline: 'Flying Blue',
        bonusPercentage: 40,
        validUntil: '2025-12-14T00:00:00.000Z',
        minimumPoints: 10000,
        title: 'Flying Blue com 40% de bônus',
        description: 'Transferência para Flying Blue (Air France/KLM).',
        link: 'https://www.livelo.com.br/flyingblue'
    }
];

const newPromotions = [promotions[2]]; // Flying Blue is new

const changes = {
    new: newPromotions,
    expired: [],
    updated: []
};

console.log('=== Daily Summary Message ===\n');
const summaryMessage = formatDailySummary(promotions, changes);
console.log(summaryMessage);

console.log('\n\n=== New Promotions Alert ===\n');
const alertMessage = formatNewPromotionsAlert(newPromotions);
console.log(alertMessage);

console.log('\n✅ Message formatter test completed!');
