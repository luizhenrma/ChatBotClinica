const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

class MessageModel {
  constructor(databasePath = process.env.SQLITE_DATABASE || path.join(__dirname, "../../data/messages.sqlite")) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.database = new sqlite3.Database(databasePath);
    this.ready = this.initialize();
  }

  run(sql, parameters = []) {
    return new Promise((resolve, reject) => {
      this.database.run(sql, parameters, function onRun(error) {
        if (error) {
          reject(error);
          return;
        }
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  all(sql, parameters = []) {
    return new Promise((resolve, reject) => {
      this.database.all(sql, parameters, (error, rows) => {
        if (error) reject(error);
        else resolve(rows);
      });
    });
  }

  async initialize() {
    await this.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        group_name TEXT NOT NULL,
        message_from TEXT,
        message_to TEXT,
        author TEXT,
        body TEXT,
        timestamp INTEGER,
        message_type TEXT,
        has_media INTEGER NOT NULL DEFAULT 0,
        message_data TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pendente', 'enviado')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async save(message, groupName, messageData) {
    await this.ready;
    const id = message.id && (message.id._serialized || message.id.id)
      ? (message.id._serialized || message.id.id)
      : `${message.from || "unknown"}-${message.timestamp || Date.now()}`;

    await this.run(`
      INSERT OR IGNORE INTO messages (
        id, group_name, message_from, message_to, author, body, timestamp,
        message_type, has_media, message_data, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')
    `, [
      id,
      groupName,
      message.from || null,
      message.to || null,
      message.author || null,
      message.body || null,
      message.timestamp || null,
      message.type || null,
      message.hasMedia ? 1 : 0,
      JSON.stringify(messageData),
    ]);
  }

  async getPendingAndMarkAsSent() {
    await this.ready;
    await this.run("BEGIN TRANSACTION");

    try {
      const rows = await this.all(
        "SELECT * FROM messages WHERE status = 'pendente' ORDER BY timestamp ASC, created_at ASC",
      );
      if (rows.length > 0) {
        await this.run("UPDATE messages SET status = 'enviado' WHERE status = 'pendente'");
      }
      await this.run("COMMIT");
      return rows;
    } catch (error) {
      await this.run("ROLLBACK").catch(() => {});
      throw error;
    }
  }

  close() {
    return new Promise((resolve, reject) => {
      this.database.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

module.exports = MessageModel;
