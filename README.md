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

Após a primeira leitura do QR Code, a sessão é salva localmente em `.wwebjs_auth` e será reutilizada nas próximas inicializações. Se a sessão expirar ou não puder ser restaurada, o bot exibirá um novo QR Code para estabelecer a conexão novamente. Não remova esse diretório se quiser manter a sessão.

Para enviar uma mensagem pela API, o WhatsApp precisa estar conectado:

`/mensagem` não deve ser aberto diretamente no navegador, pois o navegador faz uma requisição `GET`. Use uma ferramenta que permita enviar `POST`, como `curl`, Postman ou Insomnia.

```bash
curl -X POST http://localhost:3000/mensagem \
	-H "Content-Type: application/json" \
	-d '{"destinatario":"556191018101","mensagem":"Chego em casa umas 12:30"}'
```

O campo `destinatario` pode ser:

- um número de celular com código do país, somente números; ou
- o ID do grupo salvo no banco, no formato `1234567890@g.us` (ex.: o valor da coluna `id` da tabela `GrupoChat`).

Exemplo para grupo:

```bash
curl -X POST http://localhost:3000/mensagem \
  -H "Content-Type: application/json" \
  -d '{"destinatario":"120363123456789@g.us","mensagem":"Olá, grupo!"}'
```

Mensagens recebidas no grupo `ChatBotClinica` são armazenadas em `data/messages.sqlite` com status `pendente`. Para consultar as operações pendentes, use:

```bash
curl http://localhost:3000/operacoes
```

Após a consulta, os registros retornados recebem status `enviado` e não aparecem em consultas posteriores.