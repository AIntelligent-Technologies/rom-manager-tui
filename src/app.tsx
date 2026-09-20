/**
 * ROM Manager TUI - Application Entry
 * Built with OpenTUI v0.1.75
 */

import { DatabaseManager } from './models/database';
import { ConfigManager } from './models/config';
import { LibraryManager } from './models/library';
import { GameStats } from './models/game';

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Render the dashboard to terminal using ANSI escape codes
 */
function renderDashboard(stats: GameStats, config: ConfigManager): void {
  const systemCount = Object.keys(stats.gamesBySystem).length;
  const systemEntries = Object.entries(stats.gamesBySystem).sort(([, a], [, b]) => b - a);

  // Clear screen and hide cursor
  process.stdout.write('\x1b[2J\x1b[H\x1b[?25l');

  const lines: string[] = [];

  // Header
  lines.push('\x1b[1;36m┌─ ROM Manager TUI v1.0.0 ─────────────────────────────────────┐\x1b[0m');
  lines.push(
    `\x1b[36m│\x1b[0m  Library: \x1b[1;37m${stats.totalGames}\x1b[0m games | \x1b[1;37m${systemCount}\x1b[0m systems | \x1b[1;37m${formatSize(stats.totalSize)}\x1b[0m`,
  );
  lines.push('\x1b[36m├───────────────────────────────────────────────────────────────┤\x1b[0m');
  lines.push('');

  // Empty state onboarding
  if (stats.totalGames === 0) {
    lines.push('\x1b[1;33m  🚀 Getting Started\x1b[0m');
    lines.push("    Your library is empty. Here's how to get started:");
    lines.push('');
    lines.push(
      '    \x1b[1;37m1.\x1b[0m Press \x1b[1;37m[D]\x1b[0m to scan your Downloads folder for ROMs',
    );
    lines.push('    \x1b[1;37m2.\x1b[0m Or manually add ROM files to your library directory:');
    lines.push(`       \x1b[36m${config.getLibraryPath()}\x1b[0m`);
    lines.push('');
    lines.push(
      '    \x1b[90m💡 Tip: Supported formats include .zip, .7z, .rar, and individual ROM files\x1b[0m',
    );
    lines.push('');
  } else {
    // Quick Stats
    lines.push('\x1b[1;33m  Quick Stats\x1b[0m');
    lines.push(`    Total Games:   \x1b[1;37m${stats.totalGames}\x1b[0m`);
    lines.push(`    Systems:       \x1b[1;37m${systemCount}\x1b[0m`);
    lines.push(`    Library Size:  \x1b[1;37m${formatSize(stats.totalSize)}\x1b[0m`);
    lines.push(`    Verified:      \x1b[1;32m${stats.verifiedCount}\x1b[0m`);
    lines.push(`    Favorites:     \x1b[1;35m${stats.favoriteCount}\x1b[0m`);
    lines.push(`    In Curation:   \x1b[1;34m${stats.inCurationCount}\x1b[0m`);
    lines.push('');

    // Systems breakdown
    lines.push('\x1b[1;33m  Systems\x1b[0m');
    for (const [system, count] of systemEntries.slice(0, 12)) {
      const bar = '█'.repeat(Math.ceil(count / (stats.totalGames / 30)));
      const padded = system.padEnd(10);
      lines.push(`    ${padded} \x1b[34m${bar}\x1b[0m ${count}`);
    }
    lines.push('');
  }

  // Quick Actions
  lines.push('\x1b[1;33m  ⚡ Quick Actions\x1b[0m');
  lines.push('    \x1b[1;36m[L]\x1b[0m Browse Library       \x1b[1;36m[D]\x1b[0m Scan Downloads');
  lines.push('    \x1b[1;36m[C]\x1b[0m Curation Studio      \x1b[1;36m[S]\x1b[0m SD Card Manager');
  lines.push('    \x1b[1;36m[/]\x1b[0m Search Games         \x1b[1;36m[?]\x1b[0m Help');
  lines.push('');

  // Region breakdown
  if (Object.keys(stats.gamesByRegion).length > 0) {
    lines.push('\x1b[1;33m  Regions\x1b[0m');
    for (const [region, count] of Object.entries(stats.gamesByRegion).sort(
      ([, a], [, b]) => b - a,
    )) {
      const pct = ((count / stats.totalGames) * 100).toFixed(1);
      lines.push(`    ${(region || 'Unknown').padEnd(12)} ${count} (${pct}%)`);
    }
    lines.push('');
  }

  // Footer
  lines.push('\x1b[36m├───────────────────────────────────────────────────────────────┤\x1b[0m');
  lines.push(
    '\x1b[36m│\x1b[0m \x1b[1;37m[L]\x1b[0mibrary \x1b[1;37m[D]\x1b[0mownloads \x1b[1;37m[C]\x1b[0muration \x1b[1;37m[S]\x1b[0mD Card \x1b[1;37m[/]\x1b[0mSearch \x1b[1;37m[q]\x1b[0mQuit',
  );
  lines.push('\x1b[1;36m└───────────────────────────────────────────────────────────────┘\x1b[0m');

  process.stdout.write(lines.join('\n') + '\n');
}

/**
 * Handle keyboard input
 */
function setupKeyboard(db: DatabaseManager, config: ConfigManager, library: LibraryManager): void {
  if (!process.stdin.isTTY) return;

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', async (key: string) => {
    switch (key) {
      case 'q':
      case '\x03': // Ctrl+C
        process.stdout.write('\x1b[2J\x1b[H\x1b[?25h'); // Clear screen and show cursor
        console.log('Goodbye!');
        db.close();
        process.exit(0);
        break;

      case 'l':
      case 'L': {
        // Library Browser
        const systems = db.getSystems();
        process.stdout.write('\x1b[2J\x1b[H');
        console.log(
          '\x1b[1;36m┌─ Library Browser ─────────────────────────────────────────────┐\x1b[0m',
        );
        console.log('');
        for (const system of systems) {
          const games = db.getGamesBySystem(system);
          console.log(`  \x1b[1;37m${system.padEnd(12)}\x1b[0m ${games.length} games`);
          for (const game of games.slice(0, 5)) {
            const verified = game.verified ? ' \x1b[32m[!]\x1b[0m' : '';
            const region = game.region ? ` \x1b[33m(${game.region})\x1b[0m` : '';
            console.log(`    ${game.title}${region}${verified}`);
          }
          if (games.length > 5) {
            console.log(`    ... and ${games.length - 5} more`);
          }
          console.log('');
        }
        console.log(
          '\x1b[36m└───────────────────────────────────────────────────────────────┘\x1b[0m',
        );
        console.log('\nPress [h] to go home, [q] to quit');
        break;
      }

      case '/': {
        // Search
        process.stdout.write('\x1b[2J\x1b[H');
        console.log(
          '\x1b[1;36m┌─ Search ──────────────────────────────────────────────────────┐\x1b[0m',
        );
        console.log('  Type a search query and press Enter.');
        console.log('  Press [Esc] to cancel.');
        console.log(
          '\x1b[36m└───────────────────────────────────────────────────────────────┘\x1b[0m',
        );
        // TODO: implement interactive search input
        console.log('\nPress [h] to go home');
        break;
      }

      case 'h':
      case 'H': {
        // Return to dashboard
        const stats = db.getStats();
        renderDashboard(stats, config);
        break;
      }

      case '?': {
        // Help
        process.stdout.write('\x1b[2J\x1b[H');
        console.log(
          '\x1b[1;36m┌─ Keyboard Shortcuts ─────────────────────────────────────────┐\x1b[0m',
        );
        console.log('');
        console.log('  \x1b[1;33mNavigation\x1b[0m');
        console.log('    \x1b[1;37mh\x1b[0m         Home (Dashboard)');
        console.log('    \x1b[1;37mL\x1b[0m         Library Browser');
        console.log('    \x1b[1;37mD\x1b[0m         Downloads Manager');
        console.log('    \x1b[1;37mC\x1b[0m         Curation Studio');
        console.log('    \x1b[1;37mS\x1b[0m         SD Card Manager');
        console.log('    \x1b[1;37m/\x1b[0m         Search');
        console.log('    \x1b[1;37m?\x1b[0m         This help screen');
        console.log('');
        console.log('  \x1b[1;33mActions\x1b[0m');
        console.log('    \x1b[1;37mq\x1b[0m         Quit');
        console.log('    \x1b[1;37mCtrl+C\x1b[0m    Force quit');
        console.log('');
        console.log(
          '\x1b[36m└───────────────────────────────────────────────────────────────┘\x1b[0m',
        );
        console.log('\nPress [h] to go home');
        break;
      }

      default:
        break;
    }
  });
}

/**
 * Start the application
 */
export async function startApp(): Promise<void> {
  try {
    // Show loading message
    process.stdout.write('\x1b[2J\x1b[H');
    process.stdout.write('\x1b[1;36mLoading ROM Manager...\x1b[0m\r');

    // Initialize configuration
    const config = new ConfigManager();

    // Initialize database
    const db = new DatabaseManager();

    // Initialize library manager
    const library = new LibraryManager(db, config);

    // Debounce to prevent multiple renders during terminal setup
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Get initial stats
    const stats = db.getStats();

    // Render dashboard
    renderDashboard(stats, config);

    // Setup keyboard input after render completes
    setupKeyboard(db, config, library);

    // Handle cleanup on exit
    process.on('SIGTERM', () => {
      process.stdout.write('\x1b[?25h'); // Show cursor
      db.close();
      process.exit(0);
    });
  } catch (error) {
    process.stdout.write('\x1b[2J\x1b[H\x1b[?25h'); // Clear and show cursor
    console.error(
      '\x1b[1;31mError starting ROM Manager:\x1b[0m',
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}
