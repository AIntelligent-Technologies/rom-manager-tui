/**
 * GoodTools Filename Parser
 * Parses ROMs using GoodTools/No-Intro naming convention
 *
 * Format: Title (Region) [Flags].ext
 * Example: Pokemon Emerald (U) [!].gba
 *
 * Region codes:
 * - (U) = USA/NTSC
 * - (E) = Europe/PAL
 * - (J) = Japan
 * - (W) = World
 * - (A) = Australia
 *
 * Quality flags:
 * - [!] = Verified good dump
 * - [b] = Bad dump (unsupported/incomplete/corrupt)
 * - [h] = Hack/mod
 * - [T+] = Translation
 */

import { Region } from '../models/game';

export interface ParsedFilename {
  title: string;
  region: Region | undefined;
  version: string | undefined;
  verified: boolean;
  badDump: boolean;
  hack: boolean;
  translation: boolean;
  language: string | undefined;
  extension: string;
  cleanFilename: string; // Filename with extension
}

/**
 * Parse a GoodTools-formatted ROM filename
 *
 * @param filename Full filename with extension (e.g., "Pokemon Emerald (U) [!].gba")
 * @returns Parsed metadata
 *
 * @example
 * parseFilename("Pokemon Emerald (U) [!].gba")
 * // Returns:
 * // {
 * //   title: "Pokemon Emerald",
 * //   region: "USA",
 * //   version: undefined,
 * //   verified: true,
 * //   badDump: false,
 * //   hack: false,
 * //   translation: false,
 * //   extension: ".gba",
 * //   cleanFilename: "Pokemon Emerald (U) [!].gba"
 * // }
 */
export function parseFilename(filename: string): ParsedFilename {
  const result: ParsedFilename = {
    title: '',
    region: undefined,
    version: undefined,
    verified: false,
    badDump: false,
    hack: false,
    translation: false,
    language: undefined,
    extension: '',
    cleanFilename: filename,
  };

  // Extract extension
  const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
  if (extMatch) {
    result.extension = extMatch[0];
  }

  // Remove extension for parsing
  let base = filename.substring(0, filename.length - result.extension.length);

  // Parse flags
  if (base.includes('[!]')) {
    result.verified = true;
    base = base.replace(/\s*\[!\]\s*/g, ' ');
  }
  if (base.includes('[b]')) {
    result.badDump = true;
    base = base.replace(/\s*\[b\]\s*/g, ' ');
  }
  if (base.includes('[h]')) {
    result.hack = true;
    base = base.replace(/\s*\[h\]\s*/g, ' ');
  }
  if (base.includes('[T+]')) {
    result.translation = true;
    base = base.replace(/\s*\[T\+\]\s*/g, ' ');
  }

  // Parse region and other metadata in parentheses
  const regionMatch = base.match(/\(([^)]*)\)/);
  if (regionMatch) {
    const regionStr = regionMatch[1].trim();
    result.region = parseRegion(regionStr);
    result.language = parseLanguage(regionStr);
    result.version = parseVersion(regionStr);
    base = base.replace(/\s*\([^)]*\)\s*/g, ' ');
  }

  // Clean up title (remove extra spaces)
  result.title = base.trim().replace(/\s+/g, ' ');

  return result;
}

/**
 * Parse region code to human-readable format
 *
 * @param code Region code string from filename (e.g., "U", "E", "USA")
 * @returns Standardized region name
 */
function parseRegion(code: string): Region | undefined {
  const upper = code.toUpperCase();

  // Single letter codes
  if (upper.includes('U') || upper.includes('USA')) return 'USA';
  if (upper.includes('E') || upper.includes('EUR')) return 'Europe';
  if (upper.includes('J') || upper.includes('JAP')) return 'Japan';
  if (upper.includes('W') || upper.includes('WOR')) return 'World';
  if (upper.includes('A') || upper.includes('AUS')) return 'Australia';

  // Default: return as-is if not recognized
  return code;
}

/**
 * Parse language code from parentheses
 *
 * @param code String from parentheses (e.g., "U, En, Fr")
 * @returns Language code (e.g., "En", "Fr")
 */
function parseLanguage(code: string): string | undefined {
  const parts = code.split(',').map((p) => p.trim());

  for (const part of parts) {
    // Check for 2-letter language codes
    if (/^[A-Za-z]{2}$/.test(part)) {
      return part;
    }
    // Check for language words
    if (/^En|Fr|Ja|De|Es|It/i.test(part)) {
      return part;
    }
  }

  return undefined;
}

/**
 * Parse version code from parentheses
 *
 * @param code String from parentheses (e.g., "U, Rev A")
 * @returns Version string (e.g., "Rev A", "v1.1")
 */
function parseVersion(code: string): string | undefined {
  const parts = code.split(',').map((p) => p.trim());

  for (const part of parts) {
    // Check for revision/version patterns
    if (/^Rev|^v\d|^Version/i.test(part)) {
      return part;
    }
  }

  return undefined;
}

/**
 * Detect system from file extension
 *
 * @param filename Full filename or extension (e.g., "game.gba" or ".gba")
 * @returns System name (e.g., "GBA", "NES")
 */
export function detectSystem(filename: string): string {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));

  // Direct mappings
  const extToSystem: Record<string, string> = {
    '.gba': 'GBA',
    '.gbc': 'GBC',
    '.gb': 'GB',
    '.nes': 'NES',
    '.sfc': 'SNES',
    '.smc': 'SNES',
    '.z64': 'N64',
    '.n64': 'N64',
    '.nds': 'NDS',
    '.md': 'Genesis',
    '.gen': 'Genesis',
    '.gg': 'Game Gear',
    '.psx': 'PS1',
    '.ps1': 'PS1',
    '.psp': 'PSP',
    '.iso': 'PSP', // Could be PSP or PS1
    '.cso': 'PSP', // Could be PSP or PS1
    '.pbp': 'PSP',
    '.a26': 'Atari 2600',
    '.a78': 'Atari 7800',
    '.7z': 'Unknown', // Archive, need more context
    '.zip': 'Unknown', // Archive, need more context
    '.chd': 'Unknown', // Disk image, need more context
  };

  return extToSystem[ext] || 'Unknown';
}

/**
 * Check if filename is a ROM file
 *
 * @param filename Filename to check
 * @returns true if filename appears to be a ROM
 */
export function isROMFile(filename: string): boolean {
  const romExtensions = [
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
    '.a26',
    '.a78',
    '.7z',
    '.zip',
    '.chd',
    '.pbp',
    '.iso',
    '.cso',
  ];

  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return romExtensions.includes(ext);
}

/**
 * Normalize a title for comparison
 * Useful for duplicate detection
 *
 * @param title Title string
 * @returns Normalized title (lowercase, no special chars)
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Compare two filenames for similarity
 *
 * @param file1 First filename
 * @param file2 Second filename
 * @returns Similarity score (0-1, where 1 is identical)
 */
export function compareFilenames(file1: string, file2: string): number {
  const parsed1 = parseFilename(file1);
  const parsed2 = parseFilename(file2);

  // Exact title match
  if (parsed1.title.toLowerCase() === parsed2.title.toLowerCase()) {
    return 1.0;
  }

  // Normalized title match
  if (normalizeTitle(parsed1.title) === normalizeTitle(parsed2.title)) {
    return 0.95;
  }

  // Calculate Levenshtein similarity as fallback
  return levenshteinSimilarity(normalizeTitle(parsed1.title), normalizeTitle(parsed2.title));
}

/**
 * Calculate Levenshtein distance between two strings
 *
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity score (0-1)
 */
function levenshteinSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1.0 - distance / maxLen;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i++) {
    track[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator,
      );
    }
  }

  return track[str2.length][str1.length];
}
