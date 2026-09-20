/**
 * SQLite Database Manager
 * Handles all database operations for ROM library
 */

import { Database } from 'bun:sqlite';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { Game, GameInput, GameStats } from './game';
import { randomUUID } from 'crypto';

/**
 * Database initialization and schema
 */
const SCHEMA = `
-- Games table
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  path TEXT UNIQUE NOT NULL,
  size INTEGER NOT NULL,

  title TEXT NOT NULL,
  system TEXT NOT NULL,
  region TEXT,
  language TEXT,
  version TEXT,
  release_date TEXT,

  verified INTEGER DEFAULT 0,
  bad_dump INTEGER DEFAULT 0,
  hack INTEGER DEFAULT 0,
  translation INTEGER DEFAULT 0,

  priority INTEGER DEFAULT 9999,
  favorite INTEGER DEFAULT 0,
  in_curation INTEGER DEFAULT 0,
  on_sd_card INTEGER DEFAULT 0,
  must_have_series TEXT,

  description TEXT,
  genre TEXT,
  developer TEXT,
  publisher TEXT,
  players TEXT,
  rating REAL,
  cover_art TEXT,

  playcount INTEGER DEFAULT 0,
  last_played TEXT,

  crc32 TEXT,
  md5 TEXT,
  sha1 TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_system ON games(system);
CREATE INDEX IF NOT EXISTS idx_title ON games(title);
CREATE INDEX IF NOT EXISTS idx_region ON games(region);
CREATE INDEX IF NOT EXISTS idx_favorite ON games(favorite);
CREATE INDEX IF NOT EXISTS idx_priority ON games(priority);
CREATE INDEX IF NOT EXISTS idx_crc32 ON games(crc32);
CREATE INDEX IF NOT EXISTS idx_must_have ON games(must_have_series);
CREATE INDEX IF NOT EXISTS idx_path ON games(path);

-- Full-text search table (standalone, synced manually)
CREATE VIRTUAL TABLE IF NOT EXISTS games_fts USING fts5(
  game_id,
  title,
  filename,
  description
);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  max_size INTEGER,
  total_size INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_flashed TEXT
);

-- Collection games (many-to-many)
CREATE TABLE IF NOT EXISTS collection_games (
  collection_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  added_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, game_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collection_games ON collection_games(collection_id);
`;

/**
 * DatabaseManager class
 */
export class DatabaseManager {
  private db: InstanceType<typeof Database>;
  private dbPath: string;

  /**
   * Initialize database connection
   *
   * @param dbPath Optional path to database file. Defaults to ~/.rom-manager/library.db
   */
  constructor(dbPath?: string) {
    // Determine database path
    if (!dbPath) {
      const configDir = join(homedir(), '.rom-manager');
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      this.dbPath = join(configDir, 'library.db');
    } else {
      this.dbPath = dbPath;
    }

    // Open database
    this.db = new Database(this.dbPath);

    // Enable foreign keys
    this.db.exec('PRAGMA foreign_keys = ON');

    // Initialize schema
    this.initializeSchema();
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    try {
      const statements = SCHEMA.split(';').filter((stmt) => stmt.trim());
      for (const statement of statements) {
        this.db.exec(statement);
      }
    } catch (error) {
      throw new Error(`Failed to initialize database schema: ${error}`);
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Get database path
   */
  getPath(): string {
    return this.dbPath;
  }

  /**
   * Get raw database instance (for advanced queries)
   */
  getRawDatabase(): InstanceType<typeof Database> {
    return this.db;
  }

  /**
   * Upsert a game (insert or update)
   *
   * @param game Game data to insert or update
   * @returns The inserted/updated game ID
   */
  upsertGame(game: GameInput): string {
    const id = game.crc32 ? this.getGameByCrc32(game.crc32)?.id : undefined;

    if (id) {
      // Update existing game
      const update = this.db.prepare(`
        UPDATE games SET
          filename = ?,
          path = ?,
          size = ?,
          title = ?,
          system = ?,
          region = ?,
          language = ?,
          version = ?,
          verified = ?,
          bad_dump = ?,
          hack = ?,
          translation = ?,
          priority = ?,
          favorite = ?,
          in_curation = ?,
          on_sd_card = ?,
          must_have_series = ?,
          playcount = ?,
          crc32 = ?,
          updated_at = ?
        WHERE id = ?
      `);

      update.run(
        game.filename,
        game.path,
        game.size,
        game.title,
        game.system,
        game.region || null,
        null,
        null,
        game.verified ? 1 : 0,
        game.badDump ? 1 : 0,
        game.hack ? 1 : 0,
        game.translation ? 1 : 0,
        game.priority ?? 9999,
        game.favorite ? 1 : 0,
        game.inCuration ? 1 : 0,
        game.onSDCard ? 1 : 0,
        game.mustHaveSeries || null,
        game.playcount ?? 0,
        game.crc32 || null,
        new Date().toISOString(),
        id,
      );

      return id;
    } else {
      // Insert new game
      const newId = game.crc32 ? this.getGameByCrc32(game.crc32)?.id : randomUUID();

      const insert = this.db.prepare(`
        INSERT INTO games (
          id, filename, path, size, title, system, region,
          verified, bad_dump, hack, translation,
          priority, favorite, in_curation, on_sd_card, must_have_series,
          playcount, crc32, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insert.run(
        newId,
        game.filename,
        game.path,
        game.size,
        game.title,
        game.system,
        game.region || null,
        game.verified ? 1 : 0,
        game.badDump ? 1 : 0,
        game.hack ? 1 : 0,
        game.translation ? 1 : 0,
        game.priority ?? 9999,
        game.favorite ? 1 : 0,
        game.inCuration ? 1 : 0,
        game.onSDCard ? 1 : 0,
        game.mustHaveSeries || null,
        game.playcount ?? 0,
        game.crc32 || null,
        new Date().toISOString(),
        new Date().toISOString(),
      );

      return newId;
    }
  }

  /**
   * Get a game by ID
   */
  getGame(id: string): Game | null {
    const stmt = this.db.prepare('SELECT * FROM games WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.rowToGame(row) : null;
  }

  /**
   * Get a game by path
   */
  getGameByPath(path: string): Game | null {
    const stmt = this.db.prepare('SELECT * FROM games WHERE path = ?');
    const row = stmt.get(path) as any;
    return row ? this.rowToGame(row) : null;
  }

  /**
   * Get a game by CRC32 hash
   */
  getGameByCrc32(crc32: string): Game | null {
    const stmt = this.db.prepare('SELECT * FROM games WHERE crc32 = ? LIMIT 1');
    const row = stmt.get(crc32) as any;
    return row ? this.rowToGame(row) : null;
  }

  /**
   * Get all games
   */
  getAllGames(): Game[] {
    const stmt = this.db.prepare('SELECT * FROM games ORDER BY title ASC');
    const rows = stmt.all() as any[];
    return rows.map((row) => this.rowToGame(row));
  }

  /**
   * Get games by system
   */
  getGamesBySystem(system: string): Game[] {
    const stmt = this.db.prepare('SELECT * FROM games WHERE system = ? ORDER BY title ASC');
    const rows = stmt.all(system) as any[];
    return rows.map((row) => this.rowToGame(row));
  }

  /**
   * Get games by region
   */
  getGamesByRegion(region: string): Game[] {
    const stmt = this.db.prepare('SELECT * FROM games WHERE region = ? ORDER BY title ASC');
    const rows = stmt.all(region) as any[];
    return rows.map((row) => this.rowToGame(row));
  }

  /**
   * Get favorite games
   */
  getFavorites(): Game[] {
    const stmt = this.db.prepare('SELECT * FROM games WHERE favorite = 1 ORDER BY title ASC');
    const rows = stmt.all() as any[];
    return rows.map((row) => this.rowToGame(row));
  }

  /**
   * Get games in curation collection
   */
  getInCuration(): Game[] {
    const stmt = this.db.prepare(
      'SELECT * FROM games WHERE in_curation = 1 ORDER BY priority ASC, title ASC',
    );
    const rows = stmt.all() as any[];
    return rows.map((row) => this.rowToGame(row));
  }

  /**
   * Search games by full-text search
   */
  search(query: string, limit = 50): Game[] {
    // Try FTS first, fall back to LIKE search
    try {
      const stmt = this.db.prepare(`
        SELECT g.* FROM games g
        WHERE g.id IN (
          SELECT game_id FROM games_fts WHERE games_fts MATCH ?
        )
        ORDER BY g.title ASC
        LIMIT ?
      `);
      const rows = stmt.all(query, limit) as any[];
      return rows.map((row) => this.rowToGame(row));
    } catch {
      return this.searchByTitle(query, limit);
    }
  }

  /**
   * Search games by title (LIKE)
   */
  searchByTitle(query: string, limit = 50): Game[] {
    const stmt = this.db.prepare(`
      SELECT * FROM games
      WHERE title LIKE ?
      ORDER BY title ASC
      LIMIT ?
    `);

    const rows = stmt.all(`%${query}%`, limit) as any[];
    return rows.map((row) => this.rowToGame(row));
  }

  /**
   * Get game statistics
   */
  getStats(): GameStats {
    // Total games and size
    const totalStmt = this.db.prepare(
      'SELECT COUNT(*) as count, SUM(size) as total_size FROM games',
    );
    const total = totalStmt.get() as any;

    // Games by system
    const systemStmt = this.db.prepare(
      'SELECT system, COUNT(*) as count FROM games GROUP BY system',
    );
    const systems = systemStmt.all() as any[];
    const gamesBySystem: Record<string, number> = {};
    for (const row of systems) {
      gamesBySystem[row.system] = row.count;
    }

    // Games by region
    const regionStmt = this.db.prepare(
      'SELECT region, COUNT(*) as count FROM games WHERE region IS NOT NULL GROUP BY region',
    );
    const regions = regionStmt.all() as any[];
    const gamesByRegion: Record<string, number> = {};
    for (const row of regions) {
      gamesByRegion[row.region] = row.count;
    }

    // Verified count
    const verifiedStmt = this.db.prepare('SELECT COUNT(*) as count FROM games WHERE verified = 1');
    const verified = verifiedStmt.get() as any;

    // Favorite count
    const favoriteStmt = this.db.prepare('SELECT COUNT(*) as count FROM games WHERE favorite = 1');
    const favorite = favoriteStmt.get() as any;

    // In curation count
    const curationStmt = this.db.prepare(
      'SELECT COUNT(*) as count FROM games WHERE in_curation = 1',
    );
    const curation = curationStmt.get() as any;

    return {
      totalGames: total.count || 0,
      totalSize: total.total_size || 0,
      gamesBySystem,
      gamesByRegion,
      verifiedCount: verified.count || 0,
      favoriteCount: favorite.count || 0,
      inCurationCount: curation.count || 0,
    };
  }

  /**
   * Delete a game by ID
   */
  deleteGame(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM games WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Update game metadata
   */
  updateGame(id: string, updates: Partial<Game>): boolean {
    const allowed = [
      'title',
      'system',
      'region',
      'language',
      'version',
      'verified',
      'badDump',
      'hack',
      'translation',
      'priority',
      'favorite',
      'inCuration',
      'onSDCard',
      'mustHaveSeries',
      'description',
      'genre',
      'developer',
      'publisher',
      'players',
      'rating',
      'coverArt',
      'playcount',
      'lastPlayed',
      'crc32',
      'md5',
      'sha1',
    ];

    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowed.includes(key) && value !== undefined) {
        // Convert camelCase to snake_case
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return false;
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const query = `UPDATE games SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    const result = stmt.run(...values);

    return result.changes > 0;
  }

  /**
   * Get all systems in library
   */
  getSystems(): string[] {
    const stmt = this.db.prepare('SELECT DISTINCT system FROM games ORDER BY system ASC');
    const rows = stmt.all() as any[];
    return rows.map((row) => row.system).filter(Boolean);
  }

  /**
   * Get all regions in library
   */
  getRegions(): string[] {
    const stmt = this.db.prepare(
      'SELECT DISTINCT region FROM games WHERE region IS NOT NULL ORDER BY region ASC',
    );
    const rows = stmt.all() as any[];
    return rows.map((row) => row.region);
  }

  /**
   * Create a collection
   */
  createCollection(name: string, description?: string, maxSize?: number): string {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO collections (id, name, description, max_size)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, name, description || null, maxSize || null);
    return id;
  }

  /**
   * Get collection by ID
   */
  getCollection(id: string): any {
    const stmt = this.db.prepare('SELECT * FROM collections WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Get all collections
   */
  getAllCollections(): any[] {
    const stmt = this.db.prepare('SELECT * FROM collections ORDER BY created_at DESC');
    return stmt.all();
  }

  /**
   * Add game to collection
   */
  addToCollection(collectionId: string, gameId: string): boolean {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO collection_games (collection_id, game_id)
        VALUES (?, ?)
      `);
      stmt.run(collectionId, gameId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove game from collection
   */
  removeFromCollection(collectionId: string, gameId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM collection_games
      WHERE collection_id = ? AND game_id = ?
    `);
    const result = stmt.run(collectionId, gameId);
    return result.changes > 0;
  }

  /**
   * Get games in collection
   */
  getCollectionGames(collectionId: string): Game[] {
    const stmt = this.db.prepare(`
      SELECT g.* FROM games g
      JOIN collection_games cg ON g.id = cg.game_id
      WHERE cg.collection_id = ?
      ORDER BY g.title ASC
    `);
    const rows = stmt.all(collectionId) as any[];
    return rows.map((row) => this.rowToGame(row));
  }

  /**
   * Convert database row to Game object
   */
  /**
   * Insert a game into the FTS index
   */
  indexGameForSearch(game: Game): void {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO games_fts (game_id, title, filename, description)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(game.id, game.title, game.filename, game.description || '');
    } catch {
      // FTS index failures are non-fatal
    }
  }

  private rowToGame(row: any): Game {
    return {
      id: row.id,
      filename: row.filename,
      path: row.path,
      size: row.size,
      title: row.title,
      system: row.system,
      region: row.region,
      language: row.language,
      version: row.version,
      releaseDate: row.release_date,
      verified: row.verified === 1,
      badDump: row.bad_dump === 1,
      hack: row.hack === 1,
      translation: row.translation === 1,
      priority: row.priority,
      favorite: row.favorite === 1,
      inCuration: row.in_curation === 1,
      onSDCard: row.on_sd_card === 1,
      mustHaveSeries: row.must_have_series,
      description: row.description,
      genre: row.genre,
      developer: row.developer,
      publisher: row.publisher,
      players: row.players,
      rating: row.rating,
      coverArt: row.cover_art,
      playcount: row.playcount,
      lastPlayed: row.last_played,
      crc32: row.crc32,
      md5: row.md5,
      sha1: row.sha1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

/** Alias for backwards compatibility */
export { DatabaseManager as Database };
