// =====================================
// IMPORTAÇÕES
// =====================================
const qrcode = require("qrcode-terminal");
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const path = require("path");

// =====================================
// LIMPEZA DE CACHE ANTERIOR
// =====================================
const authPath = path.join(__dirname, ".wwebjs_auth");
if (fs.existsSync(authPath)) {
  try {
    fs.rmSync(authPath, { recursive: true, force: true });
    console.log("🧹 Cache de autenticação anterior removido.");
  } catch (error) {
    console.error("⚠️ Erro ao remover cache:", error.message);
  }
}

// =====================================
// TIMERS E FORMATADORES
// =====================================
let connectionStart = null;

const formatDate = (d) => {
  try {
    return d.toLocaleString('pt-BR');
  } catch (e) {
    return d.toString();
  }
};

const formatDuration = (ms) => {
  if (!ms || ms <= 0) return '0s';
  let total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  total = total % 3600;
  const m = Math.floor(total / 60);
  const s = total % 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s) parts.push(`${s}s`);
  return parts.join(' ');
};

// =====================================
// CONFIGURAÇÃO DO CLIENTE
// =====================================
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  },
  takeoverOnConflict: true,
  takeoverTimeoutMs: 0,
});

// =====================================
// QR CODE
// =====================================
client.on("qr", (qr) => {
  console.clear();
  const now = new Date();
  console.log("📲 QR Code gerado em:", formatDate(now));
  console.log("📲 Escaneie o QR Code abaixo:");
  qrcode.generate(qr, { small: true });
});

// =====================================
// WHATSAPP CONECTADO
// =====================================
client.on("ready", () => {
  connectionStart = new Date();
  console.log("✅ Tudo certo! WhatsApp conectado.");
  console.log("🔌 Conexão iniciada em:", formatDate(connectionStart));
  console.log("⏱️ Contando tempo conectado...");
});

// =====================================
// DESCONEXÃO
// =====================================
client.on("disconnected", (reason) => {
  const end = new Date();
  let durationStr = 'desconhecido';
  if (connectionStart) {
    durationStr = formatDuration(end - connectionStart);
  }
  console.log("⚠️ Desconectado:", reason);
  console.log("🔌 Conexão encerrada em:", formatDate(end));
  console.log("⏱️ Tempo conectado:", durationStr);
  connectionStart = null;
});

// =====================================
// ERROR HANDLER
// =====================================
client.on("error", (error) => {
  console.error("❌ Erro do cliente:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Rejeição não tratada:", reason);
});

// =====================================
// INICIALIZA
// =====================================
client
  .initialize()
  .catch((error) => {
    console.error("❌ Erro ao inicializar:", error.message);
    process.exit(1);
  });

// =====================================
// FUNÇÃO DE DELAY
// =====================================
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// =====================================
// FUNIL DE MENSAGENS (SOMENTE PRIVADO)
// =====================================
client.on("message", async (msg) => {
  try {
    // ❌ IGNORA QUALQUER COISA QUE NÃO SEJA CONVERSA PRIVADA
    if (!msg.from || msg.from.endsWith("@g.us")) return;

    const chat = await msg.getChat();
    if (chat.isGroup) return; // blindagem extra

    const texto = msg.body ? msg.body.trim().toLowerCase() : "";

    // Função de digitação
    const typing = async () => {
      await chat.sendStateTyping();
      await delay(2000);
    };

    // =====================================
    // MENSAGEM INICIAL
    // =====================================
    if (/^(menu|Oi|oi|Olá|olá|Ola|ola|Bom dia|bom dia|Boa tarde|boa tarde|Boa noite|boa noite|ADS|ads|inscrever|curso|inscrição|inscricao|ifb|IFB)$/i.test(texto)) {

      await typing();

      const hora = new Date().getHours();
      let saudacao = "Olá";

      if (hora >= 5 && hora < 12) saudacao = "Bom dia";
      else if (hora >= 12 && hora < 18) saudacao = "Boa tarde";
      else saudacao = "Boa noite";

      await client.sendMessage(
        msg.from,
        `${saudacao}! 👋\n\n` +
        `Sou o Robinho 🤓, o assistente virtual do IFB e estou aqui para te ajudar. \n\n` +
        `Infelizmente o processo seletivo de 2026 para o *Curso de Tecnologia em Análise e Desenvolvimento de Sistemas* foi encerrado. 💻\n\n` +
        `Aguardamos sua inscrição no processo de 2027. Fique ligado no portal do IFB em novembro deste ano para não perder os prazos. 📆\n\n` +
        ' Se tiver dúvidas, é só perguntar!');
      
    }


  } catch (error) {
    console.error("❌ Erro no processamento da mensagem:", error);
  }
});
