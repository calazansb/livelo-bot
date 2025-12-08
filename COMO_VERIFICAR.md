# 🔍 Como Verificar o Sistema no Seu PC

## ⚡ Comando Rápido

Abra o terminal e execute:

```bash
cd /Users/bernardocalazans/.gemini/antigravity/playground/solar-hawking
./verificar.sh
```

## 📊 O que o script mostra:

### ✅ Sistema Rodando?
- Se está ativo ou não
- PID do processo
- Uso de memória

### 📱 Número WhatsApp
- Qual número está configurado
- Aviso se ainda está com número de exemplo

### 🔐 WhatsApp Autenticado?
- Se a sessão está salva
- Se precisa escanear QR code novamente

### 📝 Últimas Atividades
- Últimos 8 logs do sistema
- Mensagens enviadas
- Erros (se houver)

### ✈️ Promoções Salvas
- Quantas promoções estão armazenadas
- Quais companhias aéreas

### ⏰ Próxima Execução
- Quando será a próxima verificação
- Sempre às 12h (horário de Brasília)

## 🎯 Resumo Final

O script te diz se está tudo OK ou se precisa fazer algo.

---

## 🛠️ Outros Comandos Úteis

### Ver logs em tempo real:
```bash
tail -f logs/app.log
```
(Pressione Ctrl+C para sair)

### Ver todas as promoções salvas:
```bash
cat data/current_promotions.json
```

### Parar o sistema:
```bash
pkill -f "node.*index.js"
```

### Reiniciar o sistema:
```bash
pkill -f "node.*index.js"
npm start
```

---

**Dica**: Adicione o script aos favoritos do terminal para acesso rápido! 🚀
