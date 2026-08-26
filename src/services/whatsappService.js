const qrcodeTerminal = require("qrcode-terminal");
const qrcodeImage = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const path = require("path");
const { formatDate, formatDuration } = require("../utils/formatters");

class WhatsappService {
  constructor(connectionModel, messageModel) {
    this.connectionModel = connectionModel;
    this.messageModel = messageModel;
    this.connectionStart = null;
    this.client = new Client({
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

    this.registerEvents();
  }

  clearAuthCache() {
    const authPath = path.join(__dirname, "../../.wwebjs_auth");
    if (!fs.existsSync(authPath)) return;

    try {
      fs.rmSync(authPath, { recursive: true, force: true });
      console.log("🧹 Cache de autenticação anterior removido.");
    } catch (error) {
      console.error("⚠️ Erro ao remover cache:", error.message);
    }
  }

  registerEvents() {
    this.client.on("qr", async (qr) => {
      console.clear();
      console.log("📲 QR Code gerado em:", formatDate(new Date()));
      console.log("📲 Escaneie o QR Code abaixo:");
      qrcodeTerminal.generate(qr, { small: true });

      try {
        const image = await qrcodeImage.toDataURL(qr, { width: 320, margin: 2 });
        this.connectionModel.setQrCode(image);
      } catch (error) {
        console.error("❌ Erro ao gerar QR Code para a página:", error.message);
      }
    });

    this.client.on("ready", () => {
      this.connectionStart = new Date();
      this.connectionModel.setConnected(this.connectionStart);
      console.log("✅ Tudo certo! WhatsApp conectado.");
      console.log("🔌 Conexão iniciada em:", formatDate(this.connectionStart));
      console.log("⏱️ Contando tempo conectado...");
    });

    this.client.on("disconnected", (reason) => {
      const end = new Date();
      const duration = this.connectionStart
        ? formatDuration(end - this.connectionStart)
        : "desconhecido";

      this.connectionModel.setDisconnected();
      console.log("⚠️ Desconectado:", reason);
      console.log("🔌 Conexão encerrada em:", formatDate(end));
      console.log("⏱️ Tempo conectado:", duration);
      this.connectionStart = null;
    });

    this.client.on("error", (error) => {
      console.error("❌ Erro do cliente:", error);
    });

    this.client.on("message", this.handleMessage.bind(this));
  }

  async handleMessage(message) {
    try {
      /*if (!message.from
        || message.from.endsWith("@g.us")
        || message.from === "status@broadcast") return;*/
      if (message.from.endsWith("@g.us")) return;
      if (!message.from || message.from === "status@broadcast") return;

      const chat = await message.getChat();
      if (chat.isGroup && chat.name === "ChatBotClinica") {
        const messageData = typeof message.serialize === "function"
          ? message.serialize()
          : message;
        this.messageModel.save(message, chat.name, this.serializeSafely(messageData));
        return;
      }

      const text = message.body ? message.body.trim().toLowerCase() : "";

      if (!/^(menu|Oi|oi|Olá|olá|Ola|ola|Bom dia|bom dia|Boa tarde|boa tarde|Boa noite|boa noite|ADS|ads|inscrever|curso|inscrição|inscricao|ifb|IFB)$/i.test(text)) return;

      const hour = new Date().getHours();
      let greeting = "Olá";
      if (hour >= 5 && hour < 12) greeting = "Bom dia";
      else if (hour >= 12 && hour < 18) greeting = "Boa tarde";
      else greeting = "Boa noite";

      await this.client.sendMessage(
        message.from,
        `${greeting}! 👋` +
        ""
      );
    } catch (error) {
      console.error("❌ Erro no processamento da mensagem:", error);
    }
  }

  serializeSafely(value) {
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(value, (key, item) => {
      if (typeof item === "bigint") return item.toString();
      if (typeof item === "object" && item !== null) {
        if (seen.has(item)) return "[Circular]";
        seen.add(item);
      }
      return item;
    }));
  }

  getPendingOperations() {
    return this.messageModel.getPendingAndMarkAsSent();
  }

  async start() {
    this.clearAuthCache();
    try {
      await this.client.initialize();
    } catch (error) {
      console.error("❌ Erro ao inicializar:", error.message);
      throw error;
    }
  }

  async sendMessage(recipient, message) {
    if (!this.connectionModel.isConnected()) {
      const error = new Error("WhatsApp não está conectado.");
      error.code = "WHATSAPP_NOT_CONNECTED";
      throw error;
    }

    const recipientId = await this.resolveRecipient(recipient);
    return this.client.sendMessage(recipientId, message);
  }

  async resolveRecipient(recipient) {
    const value = recipient.trim();
    const phoneNumber = value.endsWith("@c.us")
      ? value.slice(0, -5)
      : value;
    const normalizedNumber = phoneNumber.replace(/\D/g, "");

    if (!/^\d{8,15}$/.test(normalizedNumber)) {
      const error = new Error("Destinatário inválido. Informe o número com DDI, somente números.");
      error.code = "INVALID_RECIPIENT";
      throw error;
    }

    return `${normalizedNumber}@c.us`;
  }
}

module.exports = WhatsappService;
