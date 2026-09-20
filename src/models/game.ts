/**
 * Game Model
 * Represents a ROM file with metadata
 */

export interface Game {
  // File Information
  id: string; // UUID
  filename: string; // Original filename
  path: string; // Absolute path
  size: number; // Bytes

  // Metadata
  title: string; // Clean title (no region)
  system: string; // NES, SNES, GBA, etc.
  region?: string; // USA, Europe, Japan, World
  language?: string; // En, Ja, Fr, etc.
  version?: string; // Rev A, v1.1, etc.
  releaseDate?: string; // YYYY-MM-DD

  // Quality Flags
  verified: boolean; // [!] flag
  badDump: boolean; // [b] flag
  hack: boolean; // [h] flag
  translation: boolean; // [T+] flag

  // Curation
  priority: number; // 0-9999 (lower = higher priority)
  favorite: boolean;
  inCuration: boolean; // In 128GB list?
  onSDCard: boolean; // Currently on SD card?
  mustHaveSeries?: string; // e.g., "Pokemon", "Zelda"

  // Rich Metadata (Optional, from scraping)
  description?: string;
  genre?: string;
  developer?: string;
  publisher?: string;
  players?: string; // "1-4"
  rating?: number; // 0.0-1.0
  coverArt?: string; // Path to image

  // Usage Statistics
  playcount: number;
  lastPlayed?: string; // ISO timestamp

  // Hashes (for verification)
  crc32?: string;
  md5?: string;
  sha1?: string;

  // Timestamps
  createdAt: string; // When added to library
  updatedAt: string; // Last modified
}

/**
 * Game creation parameters (partial, for upserting)
 */
export interface GameInput {
  filename: string;
  path: string;
  size: number;
  title: string;
  system: string;
  region?: string;
  verified?: boolean;
  badDump?: boolean;
  hack?: boolean;
  translation?: boolean;
  priority?: number;
  favorite?: boolean;
  inCuration?: boolean;
  onSDCard?: boolean;
  mustHaveSeries?: string;
  playcount?: number;
  crc32?: string;
}

/**
 * Game statistics
 */
export interface GameStats {
  totalGames: number;
  totalSize: number; // Bytes
  gamesBySystem: Record<string, number>;
  gamesByRegion: Record<string, number>;
  verifiedCount: number;
  favoriteCount: number;
  inCurationCount: number;
}

/**
 * Region type
 */
export type Region = 'USA' | 'Europe' | 'Japan' | 'World' | 'Unknown' | string;

/**
 * System type
 */
export type System =
  | 'NES'
  | 'SNES'
  | 'N64'
  | 'GBA'
  | 'GBC'
  | 'GB'
  | 'PS1'
  | 'PSP'
  | 'NDS'
  | 'Genesis'
  | 'GG'
  | 'Atari'
  | string;

/**
 * Supported ROM extensions
 */
export const ROM_EXTENSIONS = [
  '.gba',
  '.gbc',
  '.gb',
  '.nes',
  '.sfc',
  '.smc',
  '.z64',
  '.n64',
  '.nds',
  '.md',
  '.gen',
  '.gg',
  '.psx',
  '.ps1',
  '.psp',
  '.7z',
  '.zip',
  '.chd',
  '.pbp',
  '.iso',
  '.cso',
];

/**
 * System to common extensions mapping
 */
export const SYSTEM_EXTENSIONS: Record<string, string[]> = {
  GBA: ['.gba'],
  GBC: ['.gbc'],
  GB: ['.gb'],
  NES: ['.nes'],
  SNES: ['.sfc', '.smc'],
  N64: ['.z64', '.n64'],
  NDS: ['.nds'],
  Genesis: ['.md', '.gen'],
  GG: ['.gg'],
  PS1: ['.psx', '.ps1'],
  PSP: ['.psp', '.iso', '.cso', '.pbp'],
  Atari: ['.a26', '.a78'],
};
