const renderConnectionPage = ({ qrCode, status }) => {
  const qrContent = qrCode
    ? `<img src="${qrCode}" alt="QR Code para conectar ao WhatsApp" />`
    : `<div class="status">${status}</div>`;

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="3" />
    <title>Conectar WhatsApp</title>
    <style>
      :root { color-scheme: light; font-family: Arial, sans-serif; }
      body { display: grid; min-height: 100vh; margin: 0; place-items: center; background: #f3f7f5; color: #17352b; }
      main { width: min(90vw, 420px); padding: 32px; box-sizing: border-box; text-align: center; background: #fff; border: 1px solid #d6e4dd; border-radius: 12px; box-shadow: 0 8px 30px #17352b18; }
      h1 { margin: 0 0 10px; font-size: 1.6rem; }
      p { margin: 0 0 24px; color: #557066; }
      img { display: block; width: min(100%, 320px); height: auto; margin: auto; }
      .status { padding: 24px 8px; font-weight: 600; }
      small { display: block; margin-top: 20px; color: #71877e; }
    </style>
  </head>
  <body>
    <main>
      <h1>Conectar WhatsApp</h1>
      <p>Abra o WhatsApp no celular e escaneie o código abaixo.</p>
      ${qrContent}
      <small>A página atualiza automaticamente.</small>
    </main>
  </body>
</html>`;
};

module.exports = { renderConnectionPage };
