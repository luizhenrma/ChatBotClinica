const qrcodeTerminal = require("qrcode-terminal");
const qrcodeImage = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const path = require("path");
const { formatDate, formatDuration } = require("../utils/formatters");

class WhatsappService {
  static TARGET_GROUP_ID = "120363428793135401@g.us";

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
    this.client.on("message_create", this.handleCreatedMessage.bind(this));
  }

  async handleCreatedMessage(message) {
    try {
      if (!message || !message.fromMe || message.from !== WhatsappService.TARGET_GROUP_ID) {
        return;
      }

      console.log("📤 Mensagem enviada no grupo ChatBotClinica detectada.");
      await this.saveGroupMessage(message);
      console.log("✅ Mensagem enviada salva com status pendente.");
    } catch (error) {
      console.error("❌ Erro ao salvar mensagem enviada:", {
        messageFrom: message && message.from,
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async handleMessage(message) {
    try {
      console.log("📩 Mensagem recebida:", {
        from: message && message.from,
        to: message && message.to,
        type: message && message.type,
        body: message && message.body,
      });

      if (!message || !message.from) {
        console.log("⚠️ Mensagem ignorada: remetente ausente.");
        return;
      }

      if (message.from === "status@broadcast") {
        console.log("ℹ️ Mensagem de status ignorada.");
        return;
      }

      if (message.from.endsWith("@g.us")) {
        console.log("🔎 Verificando grupo pelo ID:", message.from);

        if (message.from === WhatsappService.TARGET_GROUP_ID) {
          console.log("💾 Salvando mensagem do grupo ChatBotClinica...");
          await this.saveGroupMessage(message);
          console.log("✅ Mensagem salva com status pendente.");
        } else {
          console.log("ℹ️ Mensagem ignorada: grupo diferente de ChatBotClinica.");
        }
        return;
      }

      const text = message.body ? message.body.trim().toLowerCase() : "";

      if (!/^(menu|Oi|oi|Olá|olá|Ola|ola|Bom dia|bom dia|Boa tarde|boa tarde|Boa noite|boa noite|ADS|ads|inscrever|curso|inscrição|inscricao|ifb|IFB)$/i.test(text)) {
        console.log("ℹ️ Mensagem privada ignorada: texto fora do menu.");
        return;
      }

      const hour = new Date().getHours();
      let greeting = "Olá";
      if (hour >= 5 && hour < 12) greeting = "Bom dia";
      else if (hour >= 12 && hour < 18) greeting = "Boa tarde";
      else greeting = "Boa noite";

      console.log("📤 Enviando resposta para:", message.from);
      await this.client.sendMessage(
        message.from,
        `${greeting}! 👋` +
        ""
      );
      console.log("✅ Resposta enviada.");
    } catch (error) {
      console.error("❌ Erro no processamento da mensagem:", {
        messageFrom: message && message.from,
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async saveGroupMessage(message) {
    const messageData = typeof message.serialize === "function"
      ? message.serialize()
      : message;

    await this.messageModel.save(
      message,
      "ChatBotClinica",
      this.serializeSafely(messageData),
    );
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
