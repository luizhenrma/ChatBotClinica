const ConnectionModel = require("./models/connectionModel");
const ConnectionController = require("./controllers/connectionController");
const WhatsappService = require("./services/whatsappService");

const connectionModel = new ConnectionModel();
const connectionController = new ConnectionController(connectionModel);
const whatsappService = new WhatsappService(connectionModel);

connectionController.start();

process.on("unhandledRejection", (reason) => {
  console.error("Rejeição não tratada:", reason);
});

whatsappService.start().catch(() => {
  process.exit(1);
});
