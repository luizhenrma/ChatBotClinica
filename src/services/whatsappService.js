const qrcodeTerminal = require("qrcode-terminal");
const qrcodeImage = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const path = require("path");
const { formatDate, formatDuration } = require("../utils/formatters");

class WhatsappService {
  constructor(connectionModel) {
    this.connectionModel = connectionModel;
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
      if (!message.from || message.from.endsWith("@g.us")) return;

      const chat = await message.getChat();
      if (chat.isGroup) return;

      const text = message.body ? message.body.trim().toLowerCase() : "";
      const typing = async () => {
        await chat.sendStateTyping();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      };

      if (!/^(menu|Oi|oi|Olá|olá|Ola|ola|Bom dia|bom dia|Boa tarde|boa tarde|Boa noite|boa noite|ADS|ads|inscrever|curso|inscrição|inscricao|ifb|IFB)$/i.test(text)) return;

      await typing();
      const hour = new Date().getHours();
      let greeting = "Olá";
      if (hour >= 5 && hour < 12) greeting = "Bom dia";
      else if (hour >= 12 && hour < 18) greeting = "Boa tarde";
      else greeting = "Boa noite";

      await this.client.sendMessage(
        message.from,
        `${greeting}! 👋\n\n` +
        "Sou o Robinho 🤓, o assistente virtual do IFB e estou aqui para te ajudar. \n\n" +
        "Infelizmente o processo seletivo de 2026 para o *Curso de Tecnologia em Análise e Desenvolvimento de Sistemas* foi encerrado. 💻\n\n" +
        "Aguardamos sua inscrição no processo de 2027. Fique ligado no portal do IFB em novembro deste ano para não perder os prazos. 📆\n\n" +
        " Se tiver dúvidas, é só perguntar!"
      );
    } catch (error) {
      console.error("❌ Erro no processamento da mensagem:", error);
    }
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
}

module.exports = WhatsappService;
