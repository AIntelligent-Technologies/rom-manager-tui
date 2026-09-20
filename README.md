# ROM Manager TUI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)](https://github.com/AIntelligentTech/rom-manager-tui/releases)
[![Built with OpenTUI](https://img.shields.io/badge/Built%20with-OpenTUI%20v0.1.75-blueviolet.svg)](https://github.com/sst/opentui)
[![Made for Retro Gaming](https://img.shields.io/badge/Made%20for-Retro%20Gaming-ff69b4.svg)](https://en.wikipedia.org/wiki/Retro_gaming)

A beautiful, keyboard-driven terminal user interface (TUI) for managing large ROM collections, powered by [OpenTUI](https://github.com/sst/opentui) and optimized for 7,000+ game libraries.

## Features

- **🎮 Interactive Library Browser**: Keyboard-driven navigation with Vim-style bindings for your entire ROM collection
- **🔍 Fuzzy Search**: Instant full-text search across titles, systems, and metadata
- **📥 Smart Downloads Manager**: Auto-detect new games in ~/Downloads, preview imports, handle duplicates intelligently
- **🎯 Curation Studio**: Build perfectly-sized collections (128GB SD cards) with priority scoring and must-have tracking
- **💾 SD Card Manager**: Detect cards, flash collections safely, backup/restore save states with verification
- **⚡ Performance Optimized**: Handle 7,000+ games smoothly with lazy loading, SQLite indexing, and efficient rendering
- **🛡️ Safety First**: Dry-run previews, confirmations for destructive ops, rollback capability
- **🎨 Beautiful UI**: Three-panel layout (Systems | Games | Details) with visual hierarchy and generous whitespace
- **⌨️ Keyboard-First**: Complete keyboard navigation without mouse requirement
- **🔗 Integration Friendly**: Wraps existing Python automation, preserves conversation-aware curation logic

## Quick Start

### Requirements

- **Runtime**: Bun 1.0.0+ (recommended) or Node.js 18+
- **Build Tools**: Zig 0.15.2+ (for OpenTUI native modules)
- **Terminal**: ANSI-compatible terminal emulator (xterm-256color minimum)
- **OS**: Linux, macOS, or Windows WSL
- **Disk**: Sufficient space for ROM library operations

### Installation

#### With Bun (Recommended)

```bash
git clone https://github.com/AIntelligentTech/rom-manager-tui.git
cd rom-manager-tui
bun install
bun run start
```

#### With npm

```bash
git clone https://github.com/AIntelligentTech/rom-manager-tui.git
cd rom-manager-tui
npm install
npm run start
```

#### Global Installation

```bash
bun install -g rom-manager-tui
rom-manager-tui --path /path/to/roms
```

### First Run

```bash
# Start with default configuration
bun run start

# Specify custom ROM directory
bun run start --path /Volumes/MyDrive/ROMs

# Show help
bun run start --help
```

## Usage Guide

### Core Workflows

#### 1. Browse Your Library

```
Press [L] or [h] from Dashboard → Library Browser
```

- Left panel: Systems list (NES, SNES, GBA, PS1, etc.)
- Center panel: Games in selected system
- Right panel: Game details and actions
- Use `j`/`k` to navigate, `Enter` to select

#### 2. Import Games from Downloads

```
Press [D] from Dashboard → Downloads Manager
[r] to scan → [Space] to select → [i] to import
```

- Auto-detects new games in ~/Downloads
- Identifies duplicates automatically
- Preview mode shows what will be copied
- Progress indicators and verification

#### 3. Build 128GB Collection

```
Press [C] from Dashboard → Curation Studio
[a] for auto-build → Adjust → [s] to save
```

- Intelligent prioritization algorithm
- Must-have series coverage tracking
- Space optimization (fill to exact capacity)
- Export to Excel or copy to SD card

#### 4. Flash SD Card

```
Insert SD card → Press [S] → [f] to flash
```

- Auto-detects ArkOS/Batocera firmware
- Backs up save states before flashing
- Verifies file integrity with checksums
- Safe eject with confirmation

### Keyboard Shortcuts

| Shortcut  | Action          | Shortcut   | Action            |
| --------- | --------------- | ---------- | ----------------- |
| `/`       | Search games    | `?`        | Help overlay      |
| `j`/`k`   | Up/down         | `h`/`l`    | Previous/next     |
| `g`/`G`   | Top/bottom      | `Ctrl+d/u` | Page down/up      |
| `Space`   | Toggle select   | `Enter`    | Select/confirm    |
| `L`       | Library Browser | `D`        | Downloads Manager |
| `C`       | Curation Studio | `S`        | SD Card Manager   |
| `M`       | Metadata Editor | `,`        | Settings          |
| `e`       | Edit            | `f`        | Toggle favorite   |
| `d`       | Delete          | `:`        | Command mode      |
| `q`/`Esc` | Back/cancel     | `Ctrl+C`   | Quit              |

See [USER_GUIDE.md](docs/USER_GUIDE.md) for complete documentation.

## Architecture

ROM Manager TUI is designed with:

- **Beautiful Three-Panel Layout**: Intuitive organization with systems, games, and details
- **Keyboard-First UX**: Vim-style navigation (j/k, /, :commands)
- **Conversation-Aware Curation**: Tracks 60+ must-have series from your preferences
- **Integration Layer**: Wraps existing Python automation scripts
- **Performance Optimized**: SQLite indexing, lazy loading, viewport culling for 7,300+ games

### Core Components

```
ROM Manager TUI
├── Dashboard          Quick stats, recent activity, must-haves
├── Library Browser    Three-panel system/game/details view
├── Downloads Manager  Scan, categorize, import new games
├── Curation Studio    Build and manage collections
├── SD Card Manager    Detect, flash, backup/restore
└── Metadata Editor    Edit game info, scrape metadata
```

See [TUI_ARCHITECTURE_DESIGN.md](docs/TUI_ARCHITECTURE_DESIGN.md) for comprehensive design specification.

## Development

### Setup

```bash
bun install
```

### Commands

```bash
# Run in development mode
bun run dev

# Build for production
bun run build

# Run tests
bun test

# Lint code
bun run lint

# Format code
bun run format
```

### Project Structure

```
rom-manager-tui/
├── src/
│   ├── index.tsx           Main entry point
│   ├── components/         React components
│   ├── models/             Data models (Game, Collection, Config)
│   ├── integrations/       Python script wrappers
│   ├── database/           SQLite database layer
│   ├── styles/             Theming and styling
│   └── utils/              Helper functions
├── tests/                  Test suite
├── docs/                   Documentation
├── bin/                    Utility scripts
└── .claude/                Claude Code skills
```

See [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) for detailed development information.

## Documentation

- **[USER_GUIDE.md](docs/USER_GUIDE.md)** - Complete user documentation and workflows
- **[DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)** - Development setup and architecture
- **[API.md](docs/API.md)** - Data models and configuration reference
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute
- **[SECURITY.md](SECURITY.md)** - Security policy and reporting
- **[TUI_ARCHITECTURE_DESIGN.md](docs/TUI_ARCHITECTURE_DESIGN.md)** - Complete design specification (17,000+ words)
- **[RESEARCH_SUMMARY.md](docs/RESEARCH_SUMMARY.md)** - Research and design findings

## Supported Platforms

| Platform        | Status          | Notes                                   |
| --------------- | --------------- | --------------------------------------- |
| **Linux**       | ✅ Full Support | Recommended for maximum compatibility   |
| **macOS**       | ✅ Full Support | Both Apple Silicon and Intel            |
| **Windows WSL** | ✅ Full Support | Native Windows has terminal limitations |
| **Windows**     | ⚠️ Limited      | Use WSL for full OpenTUI features       |

## Configuration

### First-Time Setup

1. Run `bun run start` to generate default config
2. Edit `config.yaml`:

```yaml
paths:
  library: /Volumes/MyDrive/ROMs/1G1R_Library
  downloads: ~/Downloads
  sdCard: /Volumes/ARKOS
  spreadsheets: /Volumes/MyDrive/ROMs/

preferences:
  regionPriority: [USA, World, Europe, Japan]
  autoScanDownloads: true
  confirmDestructive: true
  defaultCollection: 128gb-favorites

theme:
  colorScheme: dark
  accentColor: '#4299e1'
```

See [API.md](docs/API.md) for full configuration options.

## Platform Support Details

### Linux & macOS

Full support for all features:

- 7,300+ game rendering smooth
- SD card detection and flashing
- Save state backup/restore
- Metadata scraping integration

### Windows WSL

All features work through WSL:

```bash
wsl bun run start
```

Avoid native Windows CMD/PowerShell due to OpenTUI terminal limitations.

## Troubleshooting

### "Command not found: bun"

Install Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

### "Terminal not ANSI-compatible"

Set terminal type:

```bash
export TERM=xterm-256color
bun run start
```

### "Cannot find Python scripts"

Configure script paths in `config.yaml`:

```yaml
paths:
  pythonScripts: /path/to/scripts
```

### Performance Issues with Large Libraries

Rebuild index:

```bash
bun run rebuild-index
```

See [USER_GUIDE.md#Troubleshooting](docs/USER_GUIDE.md#troubleshooting) for more help.

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Code style guidelines
- Development workflow
- Pull request process
- Issue reporting

## Community

- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Share ideas and workflows
- **Wiki**: Community-contributed tips and tricks

## License

MIT License © 2026 AIntelligent Technologies

See [LICENSE](LICENSE) for details.

## Version

**Current Release**: 1.0.0

- Complete implementation of all core features
- Full documentation and testing
- Production-ready for large ROM collections
- See [CHANGELOG.md](CHANGELOG.md) for release notes

## Built With

- **[OpenTUI](https://github.com/sst/opentui)** v0.1.75 - High-performance terminal rendering
- **[React](https://react.dev/)** 18.2.0 - Component framework
- **[TypeScript](https://www.typescriptlang.org/)** 5.0+ - Type safety
- **[SQLite](https://www.sqlite.org/)** - Fast game database and indexing
- **[Bun](https://bun.sh/)** - Fast JavaScript runtime

## Acknowledgments

Inspired by:

- **lazygit** - Keyboard-driven panels and batch operations
- **ranger** - File manager UX adapted for ROM collections
- **fzf** - Fuzzy search paradigms
- **EmulationStation** - ROM management ecosystem standards

## Related Projects

- **[OpenTUI](https://github.com/sst/opentui)** - Terminal UI framework
- **[Batocera](https://batocera.org/)** - Linux-based retro gaming platform
- **[ArkOS](https://github.com/christianhaitian/arkos)** - Handheld retro gaming OS
- **[RetroPie](https://retropie.org.uk/)** - Raspberry Pi retro gaming system
