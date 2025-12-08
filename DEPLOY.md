# Guia de Deploy - Livelo Promotion Tracker

Este guia explica como colocar o seu bot para rodar 24 horas por dia em um servidor na nuvem.

Recomendamos o uso do **Railway** pela facilidade de uso e suporte a armazenamento persistente (necessário para manter o WhatsApp conectado).

## Opção 1: Deploy no Railway (Recomendado)

O Railway é uma plataforma que permite fazer deploy direto do GitHub.

### Pré-requisitos
1.  Uma conta no [GitHub](https://github.com/).
2.  Uma conta no [Railway](https://railway.app/).
3.  O código deste projeto deve estar em um repositório no seu GitHub.

### Passo a Passo

1.  **Crie um Novo Projeto no Railway**
    - Clique em "New Project" > "Deploy from GitHub repo".
    - Selecione o repositório do seu bot.

2.  **Adicione um Volume (Persistência)**
    - **MUITO IMPORTANTE**: O WhatsApp precisa salvar a sessão em um arquivo local. Se você não fizer isso, terá que escanear o QR Code toda vez que o bot reiniciar.
    - Vá nas configurações do serviço no Railway.
    - Procure por "Volumes".
    - Adicione um volume montado em: `/usr/src/app/.wwebjs_auth`

3.  **Deploy**
    - O Railway vai identificar o `Dockerfile` e começar o build automaticamente.
    - Aguarde o processo terminar.

4.  **Conectando o WhatsApp**
    - Assim que o deploy terminar, vá na aba "Logs" do Railway.
    - O QR Code será exibido no log (em formato de texto).
    - Abra o WhatsApp no seu celular > Aparelhos conectados > Conectar um aparelho.
    - Aponte a câmera para o QR Code no log do Railway.
    - **Dica**: Se o QR Code estiver difícil de ler no log, copie o texto do QR Code e use um gerador de QR Code online, ou tente ajustar o zoom do navegador.

5.  **Pronto!**
    - Seu bot agora está rodando na nuvem.
    - O volume persistente garantirá que ele continue logado mesmo se o servidor reiniciar.

---

## Opção 2: Deploy com Docker (VPS)

Se você preferir usar um servidor VPS (como DigitalOcean, AWS, Oracle Cloud), pode usar o Docker diretamente.

### Comandos

1.  **Construir a imagem**
    ```bash
    docker build -t livelo-bot .
    ```

2.  **Rodar o container**
    ```bash
    docker run -d \
      --name livelo-bot \
      --restart always \
      -v $(pwd)/.wwebjs_auth:/usr/src/app/.wwebjs_auth \
      -v $(pwd)/logs:/usr/src/app/logs \
      livelo-bot
    ```

3.  **Ver o QR Code**
    ```bash
    docker logs -f livelo-bot
    ```
