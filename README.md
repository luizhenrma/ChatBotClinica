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

Para enviar uma mensagem pela API, o WhatsApp precisa estar conectado:

`/mensagem` não deve ser aberto diretamente no navegador, pois o navegador faz uma requisição `GET`. Use uma ferramenta que permita enviar `POST`, como `curl`, Postman ou Insomnia.

```bash
curl -X POST http://localhost:3000/mensagem \
	-H "Content-Type: application/json" \
	-d '{"destinatario":"556191018101","mensagem":"Chego em casa umas 12:30"}'
```

O campo `destinatario` deve conter o número com código do país, somente números. O sistema normaliza o número e confirma se ele possui uma conta WhatsApp antes do envio.

Mensagens recebidas no grupo `ChatBotClinica` são armazenadas em `data/messages.sqlite` com status `pendente`. Para consultar as operações pendentes, use:

```bash
curl http://localhost:3000/operacoes
```

Após a consulta, os registros retornados recebem status `enviado` e não aparecem em consultas posteriores.