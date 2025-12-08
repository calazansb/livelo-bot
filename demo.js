import { formatDailySummary, formatNewPromotionsAlert } from './src/notifications/messageFormatter.js';
import { saveCurrentPromotions, detectChanges } from './src/storage/promotionStore.js';

console.log('🧪 DEMO: Simulando promoções Livelo\n');

// Simular promoções reais baseadas em promoções históricas da Livelo
const mockPromotions = [
    {
        id: 'latam-30-2025-12-31',
        airline: 'LATAM',
        bonusPercentage: 30,
        validUntil: '2025-12-31T23:59:59.000Z',
        minimumPoints: 15000,
        title: 'LATAM Pass - 30% de bônus',
        description: 'Transfira seus pontos Livelo para LATAM Pass e ganhe 30% de bônus. Válido até 31/12/2025.',
        link: 'https://www.livelo.com.br/latam',
        scrapedAt: new Date().toISOString()
    },
    {
        id: 'azul-110-2026-03-31',
        airline: 'Azul',
        bonusPercentage: 110,
        validUntil: '2026-03-31T23:59:59.000Z',
        minimumPoints: null,
        title: 'Azul Fidelidade - até 110% de bônus',
        description: 'Promoção especial para membros do Clube Livelo. Transfira para Azul Fidelidade com até 110% de bônus.',
        link: 'https://www.livelo.com.br/azul',
        scrapedAt: new Date().toISOString()
    },
    {
        id: 'flying-blue-40-2025-12-15',
        airline: 'Flying Blue',
        bonusPercentage: 40,
        validUntil: '2025-12-15T23:59:59.000Z',
        minimumPoints: 10000,
        title: 'Flying Blue - 40% de bônus',
        description: 'Transferência para Flying Blue (Air France/KLM) com 40% de bônus. Mínimo 10.000 pontos.',
        link: 'https://www.livelo.com.br/flyingblue',
        scrapedAt: new Date().toISOString()
    },
    {
        id: 'smiles-60-2026-01-31',
        airline: 'Smiles',
        bonusPercentage: 60,
        validUntil: '2026-01-31T23:59:59.000Z',
        minimumPoints: 10000,
        title: 'Smiles - 60% de bônus',
        description: 'Transfira pontos para Smiles (GOL) e ganhe 60% de bônus. Válido até 31/01/2026.',
        link: 'https://www.livelo.com.br/smiles',
        scrapedAt: new Date().toISOString()
    }
];

// Simular que Flying Blue é uma nova promoção
const oldPromotions = mockPromotions.slice(0, 3); // Sem Smiles
const newPromotions = mockPromotions; // Com Smiles

const changes = detectChanges(oldPromotions, newPromotions);

console.log('📊 Promoções simuladas:');
console.log(`   - Total: ${newPromotions.length}`);
console.log(`   - Novas: ${changes.new.length}`);
console.log(`   - Expiradas: ${changes.expired.length}`);
console.log('\n');

// Salvar promoções simuladas
await saveCurrentPromotions(newPromotions);
console.log('💾 Promoções salvas em data/current_promotions.json\n');

// Gerar mensagens
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📱 MENSAGEM DE ALERTA (Nova Promoção)\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (changes.new.length > 0) {
    const alertMessage = formatNewPromotionsAlert(changes.new);
    console.log(alertMessage);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📱 MENSAGEM DIÁRIA (Resumo Completo)\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const summaryMessage = formatDailySummary(newPromotions, changes);
console.log(summaryMessage);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('✅ DEMO COMPLETO!\n');
console.log('Este é o formato das mensagens que você receberá no WhatsApp.');
console.log('As mensagens serão enviadas automaticamente todos os dias às 12h.\n');
console.log('Para rodar o sistema completo com WhatsApp:');
console.log('  npm start\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
