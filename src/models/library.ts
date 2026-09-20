/**
 * Library Manager
 * Scans filesystem and populates database with ROM metadata
 */

import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { DatabaseManager } from './database';
import { ConfigManager } from './config';
import { Game, GameInput } from './game';
import { parseFilename, detectSystem, isROMFile } from '../utils/parser';

/**
 * Scan result statistics
 */
export interface ScanResult {
  scanned: number;
  added: number;
  updated: number;
  errors: number;
  totalSize: number;
  duration: number; // milliseconds
  newGames: Game[];
  errorFiles: { file: string; error: string }[];
}

/**
 * LibraryManager class
 */
export class LibraryManager {
  private db: DatabaseManager;
  private config: ConfigManager;
  private scanInProgress = false;

  /**
   * Initialize library manager
   */
  constructor(db: DatabaseManager, config: ConfigManager) {
    this.db = db;
    this.config = config;
  }

  /**
   * Scan library directory and populate database
   *
   * @param libraryPath Path to scan. Uses config if not provided.
   * @returns Scan results with statistics
   */
  async scanLibrary(libraryPath?: string): Promise<ScanResult> {
    if (this.scanInProgress) {
      throw new Error('Scan already in progress');
    }

    const startTime = Date.now();
    this.scanInProgress = true;

    try {
      const path = libraryPath || this.config.getLibraryPath();
      const result: ScanResult = {
        scanned: 0,
        added: 0,
        updated: 0,
        errors: 0,
        totalSize: 0,
        duration: 0,
        newGames: [],
        errorFiles: [],
      };

      // Scan each system directory
      const entries = readdirSync(path);

      for (const entry of entries) {
        const systemPath = join(path, entry);

        try {
          if (!statSync(systemPath).isDirectory()) {
            continue;
          }

          await this.scanSystem(entry, systemPath, result);
        } catch (error) {
          result.errors++;
          result.errorFiles.push({
            file: systemPath,
            error: String(error),
          });
        }
      }

      result.duration = Date.now() - startTime;
      return result;
    } finally {
      this.scanInProgress = false;
    }
  }

  /**
   * Scan a single system directory
   */
  private async scanSystem(system: string, systemPath: string, result: ScanResult): Promise<void> {
    const entries = readdirSync(systemPath, { recursive: true }) as string[];

    for (const entry of entries) {
      try {
        const filePath = join(systemPath, entry);

        // Skip directories
        if (statSync(filePath).isDirectory()) {
          continue;
        }

        // Check if ROM file
        if (!isROMFile(entry)) {
          continue;
        }

        result.scanned++;

        // Parse game from filename
        const game = this.parseGame(filePath, system);

        // Check if already in database
        const existing = this.db.getGameByPath(filePath);
        const isNew = !existing;

        // Upsert into database
        this.db.upsertGame(game);

        if (isNew) {
          result.added++;
          result.newGames.push(game as any);
        } else {
          result.updated++;
        }

        result.totalSize += game.size;
      } catch (error) {
        result.errors++;
        result.errorFiles.push({
          file: entry,
          error: String(error),
        });
      }
    }
  }

  /**
   * Parse game metadata from file
   */
  private parseGame(filePath: string, detectedSystem: string): GameInput {
    const stat = statSync(filePath);
    const filename = filePath.split('/').pop()!;

    // Parse filename using GoodTools convention
    const parsed = parseFilename(filename);

    // Detect system from extension if not provided
    const system = detectedSystem || detectSystem(filename);

    const game: GameInput = {
      filename,
      path: filePath,
      size: stat.size,
      title: parsed.title,
      system,
      region: parsed.region,
      verified: parsed.verified,
      badDump: parsed.badDump,
      hack: parsed.hack,
      translation: parsed.translation,
      priority: 9999, // Default priority
      favorite: false,
      inCuration: false,
      onSDCard: false,
      playcount: 0,
    };

    return game;
  }

  /**
   * Scan a specific subdirectory (e.g., Downloads)
   *
   * @param scanPath Path to scan
   * @returns Array of games found
   */
  async scanDirectory(scanPath: string): Promise<Game[]> {
    const games: Game[] = [];

    try {
      const entries = readdirSync(scanPath, { recursive: true }) as string[];

      for (const entry of entries) {
        try {
          const filePath = join(scanPath, entry);

          // Skip directories
          if (statSync(filePath).isDirectory()) {
            continue;
          }

          // Check if ROM file
          if (!isROMFile(entry)) {
            continue;
          }

          // Detect system
          const system = detectSystem(entry);

          // Parse game
          const game = this.parseGame(filePath, system);
          games.push(game as any);
        } catch (error) {
          // Log but continue scanning
          console.warn(`Error scanning ${entry}: ${error}`);
        }
      }
    } catch (error) {
      throw new Error(`Failed to scan directory: ${error}`);
    }

    return games;
  }

  /**
   * Find duplicate games in library
   *
   * @returns Map of duplicate groups (identified by title + system)
   */
  findDuplicates(): Map<string, Game[]> {
    const duplicates = new Map<string, Game[]>();
    const all = this.db.getAllGames();

    // Group by normalized title + system
    const groups = new Map<string, Game[]>();

    for (const game of all) {
      const key = `${game.system}:${game.title.toLowerCase()}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(game);
    }

    // Filter to only groups with duplicates
    for (const [key, games] of groups) {
      if (games.length > 1) {
        duplicates.set(key, games);
      }
    }

    return duplicates;
  }

  /**
   * Get library statistics
   */
  getStatistics() {
    return this.db.getStats();
  }

  /**
   * Get all systems in library
   */
  getSystems(): string[] {
    return this.db.getSystems();
  }

  /**
   * Get games for a system
   */
  getSystemGames(system: string): Game[] {
    return this.db.getGamesBySystem(system);
  }

  /**
   * Check if scan is in progress
   */
  isScanning(): boolean {
    return this.scanInProgress;
  }

  /**
   * Cancel current scan
   */
  cancelScan(): void {
    this.scanInProgress = false;
  }

  /**
   * Rebuild FTS index
   */
  rebuildFTSIndex(): void {
    const db = this.db.getRawDatabase();
    const games = this.db.getAllGames();

    try {
      db.exec('DELETE FROM games_fts');

      const insert = db.prepare(`
        INSERT INTO games_fts (id, title, filename, description)
        VALUES (?, ?, ?, ?)
      `);

      for (const game of games) {
        insert.run(game.id, game.title, game.filename, game.description || '');
      }
    } catch (error) {
      throw new Error(`Failed to rebuild FTS index: ${error}`);
    }
  }

  /**
   * Validate database integrity
   *
   * @returns Validation report
   */
  validateDatabase(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const db = this.db.getRawDatabase();

    try {
      // Check for orphaned collection_games
      const orphaned = db
        .prepare(
          `
        SELECT COUNT(*) as count FROM collection_games
        WHERE game_id NOT IN (SELECT id FROM games)
        OR collection_id NOT IN (SELECT id FROM collections)
      `,
        )
        .get() as any;

      if (orphaned.count > 0) {
        issues.push(`Found ${orphaned.count} orphaned collection_games entries`);
      }

      // Check for duplicate paths
      const dupes = db
        .prepare(
          `
        SELECT COUNT(*) as count FROM games
        WHERE path IN (
          SELECT path FROM games GROUP BY path HAVING COUNT(*) > 1
        )
      `,
        )
        .get() as any;

      if (dupes.count > 0) {
        issues.push(`Found ${dupes.count} duplicate paths in games`);
      }

      // Check for missing required fields
      const incomplete = db
        .prepare(
          `
        SELECT COUNT(*) as count FROM games
        WHERE title IS NULL OR system IS NULL OR path IS NULL
      `,
        )
        .get() as any;

      if (incomplete.count > 0) {
        issues.push(`Found ${incomplete.count} games with missing required fields`);
      }
    } catch (error) {
      issues.push(`Validation error: ${error}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Clean up invalid entries from database
   */
  cleanup(): { removed: number; issues: string[] } {
    const issues: string[] = [];
    let removed = 0;
    const db = this.db.getRawDatabase();

    try {
      // Remove orphaned collection_games
      const orphanedResult = db
        .prepare(
          `
        DELETE FROM collection_games
        WHERE game_id NOT IN (SELECT id FROM games)
        OR collection_id NOT IN (SELECT id FROM collections)
      `,
        )
        .run();

      if (orphanedResult.changes > 0) {
        removed += orphanedResult.changes;
        issues.push(`Removed ${orphanedResult.changes} orphaned collection_games entries`);
      }

      // Remove games with missing required fields
      const incompleteResult = db
        .prepare(
          `
        DELETE FROM games
        WHERE title IS NULL OR system IS NULL OR path IS NULL
      `,
        )
        .run();

      if (incompleteResult.changes > 0) {
        removed += incompleteResult.changes;
        issues.push(`Removed ${incompleteResult.changes} games with missing fields`);
      }
    } catch (error) {
      issues.push(`Cleanup error: ${error}`);
    }

    return { removed, issues };
  }
}
