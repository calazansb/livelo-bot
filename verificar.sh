#!/bin/bash

# Script de Verificação - Livelo Promotion Tracker
# Execute: ./verificar.sh

clear
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║     LIVELO TRACKER - VERIFICAÇÃO DE STATUS                ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se o sistema está rodando
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  SISTEMA RODANDO?"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROCESS=$(ps aux | grep "node.*index.js" | grep -v grep)

if [ -z "$PROCESS" ]; then
    echo -e "${RED}❌ Sistema NÃO está rodando${NC}"
    echo ""
    echo "Para iniciar o sistema, execute:"
    echo "  npm start"
    RUNNING=false
else
    echo -e "${GREEN}✅ Sistema ATIVO${NC}"
    echo ""
    echo "$PROCESS" | awk '{print "   PID: " $2 "\n   Memória: " $4 "% \n   Tempo: " $10}'
    RUNNING=true
fi

echo ""

# 2. Verificar número de WhatsApp configurado
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  NÚMERO DE WHATSAPP CONFIGURADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "config.json" ]; then
    PHONE=$(grep -A 1 '"recipients"' config.json | grep '+' | tr -d ' ",')
    
    if [ "$PHONE" == "+5511999999999" ]; then
        echo -e "${YELLOW}⚠️  Número padrão (exemplo)${NC}"
        echo "   $PHONE"
        echo ""
        echo "   Configure seu número real em config.json"
    else
        echo -e "${GREEN}✅ Número configurado${NC}"
        echo "   $PHONE"
    fi
else
    echo -e "${RED}❌ Arquivo config.json não encontrado${NC}"
fi

echo ""

# 3. Verificar autenticação WhatsApp
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  WHATSAPP AUTENTICADO?"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d ".wwebjs_auth" ]; then
    echo -e "${GREEN}✅ WhatsApp autenticado${NC}"
    echo "   Sessão salva em .wwebjs_auth/"
else
    echo -e "${YELLOW}⚠️  WhatsApp NÃO autenticado${NC}"
    echo ""
    echo "   Execute 'npm start' e escaneie o QR code"
fi

echo ""

# 4. Verificar logs recentes
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  ÚLTIMAS ATIVIDADES (logs)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "logs/app.log" ]; then
    echo ""
    tail -n 8 logs/app.log | sed 's/^/   /'
    echo ""
else
    echo -e "${YELLOW}⚠️  Nenhum log encontrado${NC}"
    echo "   O sistema ainda não foi executado"
fi

echo ""

# 5. Verificar promoções salvas
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  PROMOÇÕES SALVAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "data/current_promotions.json" ]; then
    PROMO_COUNT=$(grep -c '"id"' data/current_promotions.json)
    
    if [ "$PROMO_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ $PROMO_COUNT promoção(ões) salva(s)${NC}"
        echo ""
        
        # Extrair e mostrar companhias aéreas
        grep '"airline"' data/current_promotions.json | sed 's/.*: "//;s/".*//' | while read airline; do
            echo "   ✈️  $airline"
        done
    else
        echo -e "${YELLOW}⚠️  Nenhuma promoção salva${NC}"
        echo "   O sistema ainda não encontrou promoções"
    fi
else
    echo -e "${YELLOW}⚠️  Arquivo de promoções não encontrado${NC}"
fi

echo ""

# 6. Próxima execução
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  PRÓXIMA EXECUÇÃO AGENDADA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$RUNNING" = true ]; then
    CURRENT_HOUR=$(date +%H)
    
    if [ "$CURRENT_HOUR" -lt 12 ]; then
        echo -e "${GREEN}📅 Hoje às 12:00${NC}"
    else
        echo -e "${GREEN}📅 Amanhã às 12:00${NC}"
    fi
    
    echo "   (Horário de Brasília)"
else
    echo -e "${YELLOW}⚠️  Sistema não está rodando${NC}"
    echo "   Inicie o sistema para agendar execuções"
fi

echo ""

# Resumo final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$RUNNING" = true ] && [ -d ".wwebjs_auth" ]; then
    echo -e "${GREEN}✅ Sistema funcionando perfeitamente!${NC}"
    echo ""
    echo "   O sistema está ativo e enviará notificações"
    echo "   automaticamente todos os dias às 12h."
elif [ "$RUNNING" = true ]; then
    echo -e "${YELLOW}⚠️  Sistema rodando, mas WhatsApp não autenticado${NC}"
    echo ""
    echo "   Verifique o terminal onde o sistema está rodando"
    echo "   e escaneie o QR code."
else
    echo -e "${RED}❌ Sistema não está rodando${NC}"
    echo ""
    echo "   Para iniciar: npm start"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
