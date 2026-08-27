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
        group_data TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const columns = await this.all('PRAGMA table_info("GrupoChat")');
    if (columns.some((column) => column.name === "name")) {
      await this.run('ALTER TABLE "GrupoChat" RENAME TO "GrupoChat_old"');
      await this.run(`
        CREATE TABLE "GrupoChat" (
          id TEXT PRIMARY KEY,
          group_data TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await this.run(`
        INSERT INTO "GrupoChat" (id, group_data, created_at, updated_at)
        SELECT id, group_data, created_at, updated_at
        FROM "GrupoChat_old"
      `);
      await this.run('DROP TABLE "GrupoChat_old"');
    }
  }

  async save(group, groupData) {
    await this.ready;
    const id = group.id && (group.id._serialized || group.id)
      ? (group.id._serialized || group.id)
      : null;

    if (!id) throw new Error("Grupo sem identificador.");

    await this.run(`
      INSERT INTO "GrupoChat" (id, group_data)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET
        group_data = excluded.group_data,
        updated_at = CURRENT_TIMESTAMP
    `, [id, JSON.stringify(groupData)]);
  }

  async getIds() {
    await this.ready;
    const rows = await this.all('SELECT id FROM "GrupoChat" ORDER BY id ASC');
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