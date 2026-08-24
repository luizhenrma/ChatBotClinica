const http = require("http");
const { renderConnectionPage } = require("../views/connectionView");

class ConnectionController {
  constructor(connectionModel, port = process.env.PORT || 3000) {
    this.connectionModel = connectionModel;
    this.port = port;
  }

  handleRequest(request, response) {
    const requestPath = new URL(request.url, `http://${request.headers.host}`).pathname;

    if (requestPath === "/conectar") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(renderConnectionPage(this.connectionModel.getState()));
      return;
    }

    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Página não encontrada.");
  }

  start() {
    this.server = http.createServer(this.handleRequest.bind(this));
    this.server.listen(this.port, "0.0.0.0", () => {
      console.log(`🌐 Página de conexão disponível em http://localhost:${this.port}/conectar`);
    });
    return this.server;
  }
}

module.exports = ConnectionController;
