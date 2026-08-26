const ConnectionModel = require("./models/connectionModel");
const MessageModel = require("./models/messageModel");
const GrupoChatModel = require("./models/grupoChatModel");
const ConnectionController = require("./controllers/connectionController");
const WhatsappService = require("./services/whatsappService");

const connectionModel = new ConnectionModel();
const messageModel = new MessageModel();
const grupoChatModel = new GrupoChatModel();
const whatsappService = new WhatsappService(connectionModel, messageModel, grupoChatModel);
const connectionController = new ConnectionController(connectionModel, whatsappService);

connectionController.start();

process.on("unhandledRejection", (reason) => {
  console.error("Rejeição não tratada:", reason);
});

whatsappService.start().catch(() => {
  process.exit(1);
});
