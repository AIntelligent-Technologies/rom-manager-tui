/**
 * Configuration Manager
 * Handles loading, saving, and accessing application configuration
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { parse, stringify } from 'yaml';

/**
 * Application configuration interface
 */
export interface AppConfig {
  paths: {
    library: string; // ROM library path
    downloads: string; // Downloads folder path
    sdCard?: string; // SD card mount point
    spreadsheets: string; // Path to spreadsheets
  };

  preferences: {
    regionPriority: string[]; // Region preference order
    autoScanDownloads: boolean; // Auto-scan on app start
    confirmDestructive: boolean; // Ask before delete/clear
    defaultCollection: string; // Default collection name
  };

  mustHaveSeries: {
    [system: string]: string[]; // Must-have series by system
  };

  theme: {
    colorScheme: 'dark' | 'light';
    accentColor: string;
  };
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AppConfig = {
  paths: {
    library: "/Volumes/Tony's T5/Roms/1G1R_Library",
    downloads: join(homedir(), 'Downloads'),
    spreadsheets: "/Volumes/Tony's T5/Roms",
  },
  preferences: {
    regionPriority: ['USA', 'World', 'Europe', 'Japan'],
    autoScanDownloads: false,
    confirmDestructive: true,
    defaultCollection: '128GB Favorites',
  },
  mustHaveSeries: {
    GBA: ['Pokemon', 'Zelda', 'Kirby', 'Mario', 'Fire Emblem'],
    PS1: ['Final Fantasy', 'Metal Gear Solid', 'Tekken', 'Gran Turismo'],
    N64: ['Mario', 'Zelda', 'Donkey Kong', 'Mario Kart'],
    SNES: ['Mario', 'Zelda', 'Donkey Kong', 'Kirby', 'Mega Man X'],
  },

  theme: {
    colorScheme: 'dark',
    accentColor: '#4299e1',
  },
};

/**
 * ConfigManager class
 */
export class ConfigManager {
  private config: AppConfig;
  private configPath: string;

  /**
   * Initialize configuration manager
   *
   * @param configPath Optional path to config file. Defaults to ~/.rom-manager/config.yaml
   */
  constructor(configPath?: string) {
    // Determine config path
    if (!configPath) {
      const configDir = join(homedir(), '.rom-manager');
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      this.configPath = join(configDir, 'config.yaml');
    } else {
      this.configPath = configPath;
    }

    // Load or create config
    this.load();
  }

  /**
   * Load configuration from file
   */
  load(): void {
    try {
      if (existsSync(this.configPath)) {
        const yaml = readFileSync(this.configPath, 'utf-8');
        this.config = parse(yaml) as AppConfig;
        // Merge with defaults to ensure all fields exist
        this.config = this.mergeWithDefaults(this.config);
      } else {
        // Create default config
        this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        this.save();
      }
    } catch (error) {
      console.error(`Failed to load config: ${error}`);
      this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
  }

  /**
   * Save configuration to file
   */
  save(): void {
    try {
      const dir = this.configPath.substring(0, this.configPath.lastIndexOf('/'));
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const yaml = stringify(this.config);
      writeFileSync(this.configPath, yaml, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  /**
   * Get entire configuration
   */
  getConfig(): AppConfig {
    return this.config;
  }

  /**
   * Get a configuration value by dot-notation path
   *
   * @param path Dot-notation path (e.g., "paths.library")
   * @param defaultValue Value to return if path not found
   * @returns Configuration value or default
   *
   * @example
   * config.get("paths.library")  // "/Volumes/Tony's T5/Roms/1G1R_Library"
   * config.get("preferences.regionPriority") // ["USA", "World", ...]
   */
  get<T = any>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let current: any = this.config;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue as T;
      }
    }

    return current as T;
  }

  /**
   * Set a configuration value by dot-notation path
   *
   * @param path Dot-notation path (e.g., "paths.library")
   * @param value Value to set
   *
   * @example
   * config.set("paths.library", "/new/path")
   * config.set("preferences.regionPriority", ["USA", "Japan"])
   */
  set(path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = this.config;

    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
    this.save();
  }

  /**
   * Update nested configuration object
   */
  update(path: string, values: Record<string, any>): void {
    const current = this.get(path);
    if (typeof current === 'object' && current !== null) {
      this.set(path, { ...current, ...values });
    }
  }

  /**
   * Get library path
   */
  getLibraryPath(): string {
    return this.get('paths.library', DEFAULT_CONFIG.paths.library);
  }

  /**
   * Get downloads path
   */
  getDownloadsPath(): string {
    return this.get('paths.downloads', DEFAULT_CONFIG.paths.downloads);
  }

  /**
   * Get SD card path (if mounted)
   */
  getSDCardPath(): string | undefined {
    return this.get('paths.sdCard');
  }

  /**
   * Get spreadsheets path
   */
  getSpreadsheeetsPath(): string {
    return this.get('paths.spreadsheets', DEFAULT_CONFIG.paths.spreadsheets);
  }

  /**
   * Get region priority order
   */
  getRegionPriority(): string[] {
    return this.get('preferences.regionPriority', DEFAULT_CONFIG.preferences.regionPriority);
  }

  /**
   * Get must-have series for a system
   */
  getMustHaveSeries(system: string): string[] {
    const allSeries = this.get('mustHaveSeries', DEFAULT_CONFIG.mustHaveSeries);
    return allSeries[system] || [];
  }

  /**
   * Set must-have series for a system
   */
  setMustHaveSeries(system: string, series: string[]): void {
    const mustHave = this.get('mustHaveSeries', {});
    mustHave[system] = series;
    this.set('mustHaveSeries', mustHave);
  }

  /**
   * Get color scheme
   */
  getColorScheme(): 'dark' | 'light' {
    return this.get('theme.colorScheme', DEFAULT_CONFIG.theme.colorScheme);
  }

  /**
   * Get accent color
   */
  getAccentColor(): string {
    return this.get('theme.accentColor', DEFAULT_CONFIG.theme.accentColor);
  }

  /**
   * Check if should confirm destructive operations
   */
  shouldConfirmDestructive(): boolean {
    return this.get(
      'preferences.confirmDestructive',
      DEFAULT_CONFIG.preferences.confirmDestructive,
    );
  }

  /**
   * Check if should auto-scan downloads
   */
  shouldAutoScanDownloads(): boolean {
    return this.get('preferences.autoScanDownloads', DEFAULT_CONFIG.preferences.autoScanDownloads);
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    this.save();
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required paths
    if (!this.config.paths.library) {
      errors.push('paths.library is required');
    }
    if (!this.config.paths.downloads) {
      errors.push('paths.downloads is required');
    }
    if (!this.config.paths.spreadsheets) {
      errors.push('paths.spreadsheets is required');
    }

    // Check preferences
    if (!Array.isArray(this.config.preferences.regionPriority)) {
      errors.push('preferences.regionPriority must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merge provided config with defaults to ensure all fields exist
   */
  private mergeWithDefaults(config: Partial<AppConfig>): AppConfig {
    return {
      paths: {
        ...DEFAULT_CONFIG.paths,
        ...config.paths,
      },
      preferences: {
        ...DEFAULT_CONFIG.preferences,
        ...config.preferences,
      },
      mustHaveSeries: {
        ...DEFAULT_CONFIG.mustHaveSeries,
        ...(config.mustHaveSeries || {}),
      },
      theme: {
        ...DEFAULT_CONFIG.theme,
        ...config.theme,
      },
    };
  }

  /**
   * Get config file path
   */
  getConfigPath(): string {
    return this.configPath;
  }
}

/**
 * Create global config instance
 */
let globalConfig: ConfigManager | null = null;

/**
 * Get or create global config instance
 */
export function getConfigManager(path?: string): ConfigManager {
  if (!globalConfig) {
    globalConfig = new ConfigManager(path);
  }
  return globalConfig;
}
