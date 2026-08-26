const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

class GrupoChatModel {
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
      CREATE TABLE IF NOT EXISTS "GrupoChat" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        group_data TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async save(group, groupData) {
    await this.ready;
    const id = group.id && (group.id._serialized || group.id)
      ? (group.id._serialized || group.id)
      : null;

    if (!id) throw new Error("Grupo sem identificador.");

    await this.run(`
      INSERT INTO "GrupoChat" (id, name, group_data)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        group_data = excluded.group_data,
        updated_at = CURRENT_TIMESTAMP
    `, [id, group.name || "Sem nome", JSON.stringify(groupData)]);
  }

  async getIds() {
    await this.ready;
    const rows = await this.all('SELECT id FROM "GrupoChat" ORDER BY name ASC');
    return rows.map((row) => row.id);
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

module.exports = GrupoChatModel;