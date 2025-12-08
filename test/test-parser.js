import { parsePromotion, parsePromotions } from '../src/scraper/promotionParser.js';

console.log('Testing Promotion Parser...\n');

// Test data based on real Livelo promotions
const testPromotions = [
    {
        title: 'Transferência para LATAM Pass com 30% de bônus',
        description: 'Transfira seus pontos Livelo para LATAM Pass e ganhe 30% de bônus. Válido até 24/02/2025. Mínimo de 15.000 pontos.',
        link: 'https://www.livelo.com.br/latam'
    },
    {
        title: 'Azul Fidelidade - até 110% de bônus',
        description: 'Promoção especial para Clube Livelo. Transfira para Azul Fidelidade com até 110% de bônus. Válido até 30/09/2025.',
        link: 'https://www.livelo.com.br/azul'
    },
    {
        title: 'Flying Blue com 40% de bônus',
        description: 'Transferência para Flying Blue (Air France/KLM) com 40% de bônus. Mínimo 10.000 pontos. Até 01/08/2025.',
        link: 'https://www.livelo.com.br/flyingblue'
    },
    {
        title: 'Smiles - 60% de bônus',
        description: 'Transfira pontos para Smiles (GOL) e ganhe 60% de bônus. Válido até 09/10/2025. Mínimo 10.000 pontos.',
        link: 'https://www.livelo.com.br/smiles'
    }
];

console.log('=== Testing Individual Promotions ===\n');

testPromotions.forEach((promo, index) => {
    console.log(`Test ${index + 1}:`);
    const parsed = parsePromotion(promo);
    console.log(JSON.stringify(parsed, null, 2));
    console.log('\n');
});

console.log('=== Testing Batch Parsing ===\n');

const allParsed = parsePromotions(testPromotions);
console.log(`Successfully parsed ${allParsed.length} promotions:`);
allParsed.forEach(p => {
    console.log(`- ${p.airline}: ${p.bonusPercentage}% bonus (valid until ${p.validUntil})`);
});

console.log('\n✅ Parser test completed!');
