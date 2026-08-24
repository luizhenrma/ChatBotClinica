# ChatBotClinica

## Conectar ao WhatsApp

Em Ubuntu/Debian, instale as bibliotecas necessárias para o Chromium do Puppeteer:

```bash
sudo apt-get update
sudo apt-get install -y libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 libnss3 libxcomposite1 libxdamage1 libxfixes3 libxkbcommon0 libxrandr2 libasound2t64
```

Instale as dependências e inicie o bot:

```bash
npm install
node chatbot.js
```

Abra `http://localhost:3000/conectar` no navegador para visualizar o QR Code. O mesmo código continua sendo exibido no terminal. Para usar outra porta, defina a variável `PORT` antes de iniciar o bot.