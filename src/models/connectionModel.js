class ConnectionModel {
  constructor() {
    this.qrCode = null;
    this.status = "Aguardando QR Code";
    this.connectionStart = null;
  }

  setQrCode(qrCode) {
    this.qrCode = qrCode;
    this.status = "QR Code disponível";
  }

  setConnected(connectionStart) {
    this.qrCode = null;
    this.status = "WhatsApp conectado";
    this.connectionStart = connectionStart;
  }

  setDisconnected() {
    this.qrCode = null;
    this.status = "Aguardando novo QR Code";
    this.connectionStart = null;
  }

  getState() {
    return {
      qrCode: this.qrCode,
      status: this.status,
    };
  }

  isConnected() {
    return this.status === "WhatsApp conectado";
  }
}

module.exports = ConnectionModel;
