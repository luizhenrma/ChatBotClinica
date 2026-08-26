const http = require("http");
const { renderConnectionPage } = require("../views/connectionView");

class ConnectionController {
  constructor(connectionModel, whatsappService, port = process.env.PORT || 3000) {
    this.connectionModel = connectionModel;
    this.whatsappService = whatsappService;
    this.port = port;
  }

  sendJson(response, statusCode, body) {
    response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(body));
  }

  async handleRequest(request, response) {
    const requestPath = new URL(request.url, "http://localhost").pathname;

    if (request.method === "GET" && requestPath === "/conectar") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(renderConnectionPage(this.connectionModel.getState()));
      return;
    }

    if (request.method === "GET" && requestPath === "/operacoes") {
      try {
        const operations = await this.whatsappService.getPendingOperations();
        this.sendJson(response, 200, operations);
      } catch (error) {
        console.error("❌ Erro ao consultar operações:", error);
        this.sendJson(response, 500, { erro: "Não foi possível consultar as operações." });
      }
      return;
    }

    if (request.method === "POST" && requestPath === "/mensagem") {
      let body = "";
      for await (const chunk of request) {
        body += chunk;
        if (body.length > 1024 * 1024) {
          this.sendJson(response, 413, { erro: "Corpo da requisição muito grande." });
          request.destroy();
          return;
        }
      }

      let data;
      try {
        data = JSON.parse(body);
      } catch (error) {
        this.sendJson(response, 400, { erro: "O corpo deve ser um JSON válido." });
        return;
      }

      if (typeof data.destinatario !== "string" || !data.destinatario.trim()
        || typeof data.mensagem !== "string" || !data.mensagem.trim()) {
        this.sendJson(response, 400, {
          erro: "Informe destinatario e mensagem como textos não vazios.",
        });
        return;
      }

      try {
        await this.whatsappService.sendMessage(data.destinatario.trim(), data.mensagem);
        this.sendJson(response, 200, { sucesso: true, mensagem: "Mensagem enviada." });
      } catch (error) {
        if (error.code === "WHATSAPP_NOT_CONNECTED") {
          this.sendJson(response, 409, { erro: error.message });
          return;
        }

        if (error.code === "INVALID_RECIPIENT" || error.code === "RECIPIENT_NOT_FOUND") {
          this.sendJson(response, 400, { erro: error.message });
          return;
        }

        console.error("❌ Erro ao enviar mensagem pela API:", error);
        this.sendJson(response, 500, { erro: "Não foi possível enviar a mensagem." });
      }
      return;
    }

    if (requestPath === "/mensagem") {
      response.writeHead(405, {
        "Allow": "POST",
        "Content-Type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify({
        erro: "Use o método POST para enviar mensagens.",
        exemplo: "POST /mensagem com { destinatario, mensagem }",
      }));
      return;
    }

    this.sendJson(response, 404, { erro: "Rota não encontrada." });
  }

  start() {
    this.server = http.createServer(this.handleRequest.bind(this));
    this.server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ A porta ${this.port} já está em uso. Encerre o processo anterior ou use PORT=outra_porta.`);
      } else {
        console.error("❌ Erro no servidor HTTP:", error.message);
      }
      process.exitCode = 1;
    });
    this.server.listen(this.port, "0.0.0.0", () => {
      console.log(`🌐 Página de conexão disponível em http://localhost:${this.port}/conectar`);
    });
    return this.server;
  }
}

module.exports = ConnectionController;
