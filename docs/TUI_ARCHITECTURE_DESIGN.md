# ROM Manager TUI - Architecture & Design Specification

**Version:** 1.0.0
**Last Updated:** 2026-01-31
**Target Platform:** OpenTUI v0.1.75 + React

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Information Architecture](#2-information-architecture)
3. [Screen Layouts & Navigation](#3-screen-layouts--navigation)
4. [Component Library](#4-component-library)
5. [User Workflows](#5-user-workflows)
6. [Data Architecture](#6-data-architecture)
7. [Integration Layer](#7-integration-layer)
8. [Performance Strategy](#8-performance-strategy)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Design Philosophy

### 1.1 Core Principles

**Beautiful & Uncluttered**
- **Progressive Disclosure**: Show essential info first, reveal details on demand
- **Visual Hierarchy**: Clear distinction between primary and secondary information
- **Whitespace**: Generous padding and spacing for readability
- **Consistent Theming**: Unified color palette, typography, and spacing system

**Intuitive & Powerful**
- **Keyboard-First**: Every action accessible via keyboard (vim-style bindings)
- **Discoverable**: Contextual help, keyboard hints in status bar
- **Intelligent Defaults**: Sensible preconfigured workflows
- **Batch Operations**: Multi-select and bulk actions throughout

**ROM Management Focused**
- **Conversation-Aware**: Preserve the 60+ must-have series intelligence
- **Performance Optimized**: Handle 7,300+ game library smoothly
- **Safety First**: Dry-run previews, confirmations, rollback capability
- **Integration Friendly**: Wrap existing Python scripts, don't replace them

### 1.2 Design Inspirations

- **lazygit**: Keyboard-driven panels, batch operations, clear visual feedback
- **ranger**: File manager UX adapted for ROM collections
- **fzf**: Fast fuzzy search everywhere
- **btop**: Beautiful data visualizations (for statistics/space usage)

### 1.3 Target User Experience

**Common Tasks (Should Be Fast)**:
- "Show me all Pokemon games" → `/ pokemon <enter>` (2 keystrokes)
- "What's new in Downloads?" → `d` to Downloads view (1 keystroke)
- "Update library" → `:sync <enter>` (vim-style command)
- "Flash SD card" → `F` from Curation view (1 keystroke)

**Complex Tasks (Should Be Clear)**:
- Building 128GB collection: Guided workflow with live preview
- 1G1R filtering: Visual region preference configuration
- SD card management: Step-by-step with progress indicators

---

## 2. Information Architecture

### 2.1 Navigation Structure

```
┌─ ROM Manager TUI ────────────────────────────────────────┐
│                                                           │
│  Home (Dashboard)                                         │
│  ├─ Library Browser           [L]                         │
│  │  ├─ By System              [1-9]                       │
│  │  ├─ Search                 [/]                         │
│  │  ├─ Favorites              [f]                         │
│  │  └─ Recently Added         [r]                         │
│  │                                                         │
│  ├─ Downloads Manager          [D]                         │
│  │  ├─ Scan Downloads         [s]                         │
│  │  ├─ Review New Games       [r]                         │
│  │  └─ Import to Library      [i]                         │
│  │                                                         │
│  ├─ Curation Studio           [C]                         │
│  │  ├─ 128GB Collection       [1]                         │
│  │  ├─ Custom Collections     [2]                         │
│  │  ├─ Must-Have Series       [m]                         │
│  │  └─ Space Calculator       [space]                     │
│  │                                                         │
│  ├─ SD Card Manager           [S]                         │
│  │  ├─ Detect Card            [d]                         │
│  │  ├─ View Contents          [v]                         │
│  │  ├─ Flash Collection       [f]                         │
│  │  └─ Backup/Restore         [b]                         │
│  │                                                         │
│  ├─ Metadata Editor           [M]                         │
│  │  ├─ Edit Game Info         [e]                         │
│  │  ├─ Scrape Metadata        [s]                         │
│  │  └─ Export gamelist.xml    [x]                         │
│  │                                                         │
│  └─ Settings & Tools          [,]                         │
│     ├─ Library Paths          [p]                         │
│     ├─ Region Preferences     [r]                         │
│     ├─ Theme Customization    [t]                         │
│     └─ Statistics & Reports   [s]                         │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 2.2 Screen Hierarchy

**Level 0: Dashboard (Home)**
- Quick stats, recent activity, pinned actions

**Level 1: Main Views**
- Library Browser, Downloads, Curation, SD Card, Metadata, Settings

**Level 2: Detail Views**
- Individual game details, collection editor, system-specific views

**Level 3: Modals & Overlays**
- Confirmations, help overlays, progress indicators, wizards

---

## 3. Screen Layouts & Navigation

### 3.1 Dashboard (Home Screen)

**Purpose**: At-a-glance status and quick actions

**Layout** (120×30 minimum):
```
┌─ ROM Manager TUI ─────────────────────────── Home ────────┐
│  Library: 7,288 games | 22.4 GB | Last scan: 2h ago        │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─ Quick Stats ──────┐  ┌─ Recent Activity ──────────┐  │
│  │                     │  │                           │  │
│  │  Systems: 12        │  │  ✓ Scanned Downloads     │  │
│  │  Favorites: 342     │  │    Found 23 new games    │  │
│  │  128GB List: 1,124  │  │    2 hours ago           │  │
│  │  SD Card: Mounted   │  │                           │  │
│  │  Space: 94.2 GB     │  │  ✓ Added 5 games         │  │
│  │                     │  │    to library            │  │
│  └─────────────────────┘  │    Yesterday             │  │
│                           │                           │  │
│  ┌─ Quick Actions ────┐  │  ⚠ 18 duplicates         │  │
│  │                     │  │    detected              │  │
│  │  [D] Scan Downloads │  │    3 days ago            │  │
│  │  [L] Browse Library │  │                           │  │
│  │  [C] Edit 128GB     │  └───────────────────────────┘  │
│  │  [S] Manage SD Card │                                │
│  │  [/] Search Games   │  ┌─ Must-Have Series ──────┐  │
│  │                     │  │                           │  │
│  └─────────────────────┘  │  GBA: 28/28 ✓            │  │
│                           │  PS1: 18/20 (90%)        │  │
│  ┌─ Storage Overview ─┐  │  PSP: 10/12 (83%)        │  │
│  │                     │  │  N64: 12/13 (92%)        │  │
│  │  T5 Drive           │  │  NDS:  7/8  (88%)        │  │
│  │  ████████░░ 85%     │  │                           │  │
│  │  85 GB / 100 GB     │  └───────────────────────────┘  │
│  │                     │                                │
│  │  SD Card (128GB)    │                                │
│  │  █████████░  93%    │                                │
│  │  119 GB / 128 GB    │                                │
│  └─────────────────────┘                                │
│                                                           │
├───────────────────────────────────────────────────────────┤
│ [D]ownloads [L]ibrary [C]uration [S]D Card [/]Search [?]Help  │
└───────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Visual Hierarchy**: Stats boxes with clear labels and values
- **Activity Feed**: Recent operations with timestamps and status icons
- **Progress Bars**: Visual space usage indicators
- **Quick Actions**: One-key navigation to common tasks
- **Must-Have Tracker**: Progress on personalized curation goals

### 3.2 Library Browser

**Purpose**: Browse, search, and manage ROM collection

**Layout** (160×40 optimal):
```
┌─ ROM Manager TUI ───────────────────── Library Browser ───┐
│  7,288 games | 22.4 GB | Filtered: 1,138 SNES              │
├───────┬───────────────────────────────────┬───────────────┤
│       │                                   │               │
│ ┌─────┴────┐                              │  ┌─ Details ─┐│
│ │ Systems  │  ┌─ Game List ─────────────┐ │  │           ││
│ │          │  │                          │ │  │  Title:   ││
│ │ All      │  │ ◯ Chrono Trigger (U) [!] │ │  │  Chrono   ││
│ │ (7,288)  │  │ ◯ Donkey Kong Country    │ │  │  Trigger  ││
│ │          │  │ ◯ Earthbound (U) [!]     │ │  │           ││
│ │ NES      │  │ ◯ F-Zero (U) [!]         │ │  │  System:  ││
│ │ (1,624)  │  │ ◯ Final Fantasy II       │ │  │  SNES     ││
│ │          │  │ ◯ Final Fantasy III      │ │  │           ││
│ │ SNES ●   │  │ ◯ Kirby Super Star       │ │  │  Region:  ││
│ │ (1,138)  │  │ ◯ Legend of Zelda ALttP  │ │  │  USA [!]  ││
│ │          │  │ ◯ Mega Man X             │ │  │           ││
│ │ N64      │  │ ◯ Secret of Mana         │ │  │  Size:    ││
│ │ (341)    │  │ ◯ Super Mario RPG        │ │  │  4.2 MB   ││
│ │          │  │ ◯ Super Mario World      │ │  │           ││
│ │ GBA      │  │ ◯ Super Metroid          │ │  │  In 128GB:││
│ │ (1,271)  │  │                          │ │  │  Yes ✓    ││
│ │          │  │                          │ │  │           ││
│ │ GBC      │  │                          │ │  │  Priority:││
│ │ (579)    │  │                          │ │  │  Must-Have││
│ │          │  │                          │ │  │  (Score:   ││
│ │ Genesis  │  │                          │ │  │  150)     ││
│ │ (953)    │  │                          │ │  │           ││
│ │          │  │                          │ │  └───────────┘│
│ │ PS1      │  │                          │ │               │
│ │ (784)    │  └──────────────────────────┘ │  ┌─ Actions ─┐│
│ │          │                                │  │           ││
│ │ PSP      │  Showing 1-13 of 1,138        │  │ [e] Edit  ││
│ │ (412)    │                                │  │ [f] Fav   ││
│ │          │                                │  │ [c] Curate││
│ │ [+ More] │                                │  │ [d] Delete││
│ └──────────┘                                │  │ [Enter]   ││
│                                              │  │  Details  ││
│                                              │  └───────────┘│
├──────────────────────────────────────────────┴───────────────┤
│ [/]Search [f]Filter [s]Sort [Space]Select [Enter]Details [?]Help │
└───────────────────────────────────────────────────────────────┘
```

**Responsive Behavior**:

**Medium (120×30)**: Hide detail panel, show only systems + main list
**Small (80×24)**: Hide system sidebar, show only main list

**Key Features**:
- **Three-Panel Layout**: Systems (left), Games (center), Details (right)
- **Multi-Select**: Space to toggle checkboxes, batch operations
- **Live Search**: Type `/` then query, instant filtering
- **Contextual Actions**: Different actions based on selection
- **Visual Indicators**: Icons for favorites, must-haves, region verification

### 3.3 Downloads Manager

**Purpose**: Scan, review, and import new games from ~/Downloads

**Layout**:
```
┌─ ROM Manager TUI ──────────────── Downloads Manager ──────┐
│  Scanned: ~/Downloads | Found: 23 new games | 18 duplicates│
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─ Scan Results ─────────────────────────────────────┐  │
│  │                                                     │  │
│  │  New Games (23)                                     │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │ ☑ Pokemon Emerald (U) [!].gba     1.2 MB   │    │  │
│  │  │ ☑ Pokemon Fire Red (U) [!].gba    1.8 MB   │    │  │
│  │  │ ☑ Golden Sun (U) [!].gba          2.1 MB   │    │  │
│  │  │ ☑ Metroid Fusion (U) [!].gba      1.9 MB   │    │  │
│  │  │ ☑ Castlevania AoS (U) [!].gba     1.7 MB   │    │  │
│  │  │ ...                                         │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  │                                                     │  │
│  │  Duplicates (18)                                    │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │ ☐ Zelda Link's Awakening (U).gb   512 KB   │    │  │
│  │  │   Already in library                        │    │  │
│  │  │ ☐ Super Mario 64 (U) [!].z64      8.1 MB   │    │  │
│  │  │   Already in library                        │    │  │
│  │  │ ...                                         │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  │                                                     │  │
│  │  To Copy to Library (23 selected)                  │  │
│  │  Space required: 42.8 MB                            │  │
│  │  Target: /Volumes/Tony's T5/Roms/1G1R_Library/     │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─ Actions ──────────────────────────────────────────┐  │
│  │                                                     │  │
│  │  [r] Rescan Downloads                               │  │
│  │  [a] Select All New                                 │  │
│  │  [n] Deselect All                                   │  │
│  │  [i] Import Selected (23)                           │  │
│  │  [d] Delete Selected                                │  │
│  │  [p] Preview (Dry Run)                              │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
├───────────────────────────────────────────────────────────┤
│ [r]escan [i]mport [p]review [Space]Toggle [a]ll [n]one [?]Help  │
└───────────────────────────────────────────────────────────┘
```

**Workflow**:
1. **Auto-Scan on View**: Automatically scans ~/Downloads when opened
2. **Categorization**: New (green), Duplicates (yellow), Errors (red)
3. **Smart Defaults**: New games pre-selected, duplicates not selected
4. **Preview Mode**: Shows what will be copied/extracted before proceeding
5. **Progress Indicator**: Shows file copy progress with ETA

### 3.4 Curation Studio

**Purpose**: Build and manage curated game collections (esp. 128GB list)

**Layout**:
```
┌─ ROM Manager TUI ────────────── Curation Studio ──────────┐
│  Collection: 128GB Favorites | 1,124 games | 119.8 GB     │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─ Space Utilization ────────────────────────────────┐  │
│  │                                                     │  │
│  │  Used: ███████████████████████░ 119.8 GB / 120 GB  │  │
│  │  Free: 8.2 GB headroom (6.8%)                       │  │
│  │                                                     │  │
│  │  By System:                                         │  │
│  │  PSP:   ██████████░ 38.2 GB  (32%)  [412 games]    │  │
│  │  PS1:   ███████░░░░ 28.4 GB  (24%)  [168 games]    │  │
│  │  NDS:   ████░░░░░░░ 18.7 GB  (16%)  [142 games]    │  │
│  │  N64:   ███░░░░░░░░ 12.3 GB  (10%)  [89 games]     │  │
│  │  GBA:   ██░░░░░░░░░  8.2 GB  ( 7%)  [234 games]    │  │
│  │  Other: ██░░░░░░░░░  8.0 GB  ( 7%)  [79 games]     │  │
│  │  SNES:  █░░░░░░░░░░  4.1 GB  ( 3%)  [...]          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─ Must-Have Series Coverage ────────────────────────┐  │
│  │                                                     │  │
│  │  GBA:    [████████████████████] 28/28 (100%) ✓     │  │
│  │  PS1:    [██████████████████░░] 18/20 ( 90%)       │  │
│  │  PSP:    [████████████████░░░░] 10/12 ( 83%)       │  │
│  │  N64:    [██████████████████░░] 12/13 ( 92%)       │  │
│  │  NDS:    [████████████████░░░░]  7/8  ( 88%)       │  │
│  │  SNES:   [████████████████████] 12/12 (100%) ✓     │  │
│  │                                                     │  │
│  │  Missing: PS1 (Tekken 3, Gran Turismo)             │  │
│  │           PSP (Patapon, LocoRoco)                   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─ Curation Tools ────────────────────────────────────┐  │
│  │                                                     │  │
│  │  [a] Auto-Build (Intelligent)                       │  │
│  │  [m] Manage Must-Haves                              │  │
│  │  [p] Adjust Priorities                              │  │
│  │  [f] Add from Library                               │  │
│  │  [r] Remove Selected                                │  │
│  │  [s] Save Collection                                │  │
│  │  [x] Export to Excel                                │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
├───────────────────────────────────────────────────────────┤
│ [a]uto-build [f]ind [p]riority [s]ave [F]lash SD [?]Help │
└───────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Visual Space Management**: Live updating bar charts showing space usage
- **Must-Have Tracker**: Progress bars for conversation-derived series
- **Intelligent Auto-Build**: Uses existing priority algorithm
- **Live Calculations**: Updates space instantly as games added/removed
- **Export Options**: Save to Excel, CSV, or copy to SD card

### 3.5 SD Card Manager

**Purpose**: Detect, view, flash, and manage SD cards

**Layout**:
```
┌─ ROM Manager TUI ─────────────── SD Card Manager ─────────┐
│  Detected: /Volumes/ARKOS (128GB exFAT) | ArkOS detected   │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─ Card Information ─────────────────────────────────┐  │
│  │                                                     │  │
│  │  Mount Point:  /Volumes/ARKOS                       │  │
│  │  Filesystem:   exFAT                                │  │
│  │  Capacity:     128 GB (119.2 GiB)                   │  │
│  │  Used:         94.2 GB (78.9%)                      │  │
│  │  Free:         25.0 GB                              │  │
│  │  Firmware:     ArkOS v2.1.3 (detected)              │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─ Current Contents ──────────────────────────────────┐  │
│  │                                                     │  │
│  │  /roms/psx/        168 games   28.4 GB             │  │
│  │  /roms/psp/        412 games   38.2 GB             │  │
│  │  /roms/nds/        142 games   18.7 GB             │  │
│  │  /roms/n64/         89 games   12.3 GB             │  │
│  │  /roms/gba/        234 games    8.2 GB             │  │
│  │  /roms/snes/        79 games    4.1 GB             │  │
│  │  [+ 6 more systems]                                 │  │
│  │                                                     │  │
│  │  Total: 1,124 games | 94.2 GB                       │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─ Flash Workflow ────────────────────────────────────┐  │
│  │                                                     │  │
│  │  Source: 128GB Favorites Collection                 │  │
│  │  Target: /Volumes/ARKOS/roms/                       │  │
│  │                                                     │  │
│  │  ⚠ This will overwrite all ROMs on the SD card     │  │
│  │                                                     │  │
│  │  Steps:                                             │  │
│  │  1. Backup current save states     [b]             │  │
│  │  2. Preview files to copy          [p]             │  │
│  │  3. Flash collection to SD          [f]             │  │
│  │  4. Restore save states             [r]             │  │
│  │  5. Safely eject card               [e]             │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
├───────────────────────────────────────────────────────────┤
│ [v]iew [f]lash [b]ackup [e]ject [r]efresh [?]Help        │
└───────────────────────────────────────────────────────────┘
```

**Workflow Features**:
- **Auto-Detection**: Scans for mounted volumes, identifies ArkOS/Batocera
- **Safety Checks**: Confirms before destructive operations
- **Progress Tracking**: Shows file copy progress with ETA
- **Save State Backup**: Preserves saves before flashing
- **Verification**: Checksums verify successful copy

### 3.6 Search Overlay (Global)

**Trigger**: Press `/` from any screen

**Layout**:
```
┌───────────────────────────────────────────────────────────┐
│  ┌─ Search ───────────────────────────────────────────┐  │
│  │                                                     │  │
│  │  Query: pokemon█                                    │  │
│  │                                                     │  │
│  │  Results (12 found):                                │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ 1. Pokemon Ruby (U) [!]           GBA       │   │  │
│  │  │ 2. Pokemon Sapphire (U) [!]       GBA       │   │  │
│  │  │ 3. Pokemon Emerald (U) [!]        GBA       │   │  │
│  │  │ 4. Pokemon FireRed (U) [!]        GBA       │   │  │
│  │  │ 5. Pokemon LeafGreen (U) [!]      GBA       │   │  │
│  │  │ 6. Pokemon Red (U) [!]            GB        │   │  │
│  │  │ 7. Pokemon Blue (U) [!]           GB        │   │  │
│  │  │ 8. Pokemon Yellow (U) [!]         GB        │   │  │
│  │  │ 9. Pokemon Gold (U) [!]           GBC       │   │  │
│  │  │ 10. Pokemon Silver (U) [!]        GBC       │   │  │
│  │  │ 11. Pokemon Crystal (U) [!]       GBC       │   │  │
│  │  │ 12. Pokemon Stadium (U) [!]       N64       │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                     │  │
│  │  [Enter] View Details | [Esc] Cancel                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  Press [Esc] to close search                              │
└───────────────────────────────────────────────────────────┘
```

**Features**:
- **Fuzzy Search**: Matches partial strings, typos
- **Live Results**: Updates as you type
- **Multi-Field Search**: Searches title, system, filename
- **Quick Navigation**: Arrow keys + Enter to select

---

## 4. Component Library

### 4.1 Custom OpenTUI Components

#### 4.1.1 GameListItem

**Purpose**: Display game in list with metadata

**Props**:
```typescript
interface GameListItemProps {
  game: Game;
  selected: boolean;
  checked: boolean;
  focused: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}
```

**Visual**:
```
☑ Pokemon Emerald (U) [!]           GBA    1.2 MB  ★
  └─ checkbox  └─ title + region    sys    size   fav
```

**Color Coding**:
- USA region: Green `[!]`
- Europe: Blue
- Japan: Yellow
- Bad dump: Red `[b]`

#### 4.1.2 SpaceBar

**Purpose**: Visual space usage indicator

**Props**:
```typescript
interface SpaceBarProps {
  used: number;    // bytes
  total: number;   // bytes
  label?: string;
  showPercentage?: boolean;
  warningThreshold?: number;  // 0.8 = 80%
}
```

**Visual**:
```
PSP: ██████████░░░░░░░░░░ 38.2 GB / 120 GB (32%)
```

#### 4.1.3 SystemIcon

**Purpose**: Visual system identifier

**Mapping**:
```typescript
const SYSTEM_ICONS = {
  'NES':     '🎮',
  'SNES':    '🎮',
  'N64':     '🕹️',
  'GBA':     '🎮',
  'GBC':     '🎮',
  'GB':      '🎮',
  'PS1':     '💿',
  'PSP':     '🎮',
  'NDS':     '📱',
  'Genesis': '🎮',
};
```

#### 4.1.4 PriorityBadge

**Purpose**: Visual curation priority indicator

**Tiers**:
- **0-99**: `URGENT` (red, bold)
- **100-999**: `MUST-HAVE` (green)
- **1000-1999**: `PRIORITY` (blue)
- **2000+**: `BACKFILL` (gray)

#### 4.1.5 StatCard

**Purpose**: Dashboard statistic display

**Props**:
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}
```

**Visual**:
```
┌─ Systems ───┐
│             │
│   12        │  ← Large value
│   Systems   │  ← Label
│             │
└─────────────┘
```

### 4.2 Layout Components

#### 4.2.1 ThreePanelLayout

**Purpose**: Systems | List | Details layout

**Responsive**:
- **Large (160×40)**: Show all 3 panels
- **Medium (120×30)**: Hide details panel
- **Small (80×24)**: Hide system panel

#### 4.2.2 ProgressModal

**Purpose**: Show long-running operation progress

**Features**:
- Progress bar (0-100%)
- Current file being processed
- Speed (MB/s)
- ETA
- Cancel button

**Visual**:
```
┌─ Copying to SD Card ─────────────────────────────┐
│                                                   │
│  Progress: ████████████░░░░░░░░░░ 58% (412/710)  │
│                                                   │
│  Current: Pokemon Emerald (U) [!].gba             │
│  Speed:   12.4 MB/s                               │
│  ETA:     2m 14s                                  │
│                                                   │
│                      [Cancel]                     │
│                                                   │
└───────────────────────────────────────────────────┘
```

#### 4.2.3 ConfirmDialog

**Purpose**: Safety confirmation for destructive ops

**Visual**:
```
┌─ Confirm Delete ──────────────────────────────────┐
│                                                   │
│  Are you sure you want to delete 23 games?        │
│                                                   │
│  This cannot be undone.                           │
│                                                   │
│                                                   │
│            [Yes, Delete]    [Cancel]              │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## 5. User Workflows

### 5.1 Core Workflow: Update Library from Downloads

**Goal**: Scan ~/Downloads, import new games to library

**Steps**:
1. User presses `D` (Downloads Manager)
2. TUI auto-scans ~/Downloads
3. Shows categorized results (New, Duplicates, Errors)
4. User reviews, toggles checkboxes
5. Presses `p` for preview (dry-run)
6. Reviews what will be copied
7. Presses `i` to import
8. Progress modal shows copy status
9. Success notification, returns to dashboard

**Integration**: Wraps `scan_new_downloads.py` and `add_gaps_to_library.py`

### 5.2 Core Workflow: Build 128GB Collection

**Goal**: Create curated collection for SD card

**Steps**:
1. User presses `C` (Curation Studio)
2. Views current 128GB list
3. Presses `a` for auto-build
4. Modal shows:
   - Intelligent curation algorithm running
   - Priority scoring
   - Must-have series detection
   - Space calculation
5. Preview shows proposed collection
6. User adjusts:
   - Add specific games
   - Remove unwanted games
   - Adjust priorities
7. Saves collection
8. Optionally exports to Excel

**Integration**: Wraps `build_128gb_favorites.py`

### 5.3 Core Workflow: Flash SD Card

**Goal**: Deploy collection to SD card

**Steps**:
1. User inserts SD card
2. Presses `S` (SD Card Manager)
3. TUI detects card, shows current contents
4. User presses `f` to flash
5. Selects source collection (128GB Favorites)
6. Confirms destructive operation
7. Backup saves (optional, prompted)
8. Progress modal shows:
   - Files being copied
   - Speed and ETA
   - System-by-system progress
9. Verification step (checksum)
10. Restore saves (if backed up)
11. Success, prompts to eject

**Integration**: Wraps `copy_to_sd_card.py`

### 5.4 Advanced Workflow: Find Missing Must-Haves

**Goal**: Identify gaps in must-have series coverage

**Steps**:
1. User opens Curation Studio
2. Views "Must-Have Series Coverage" panel
3. Sees PS1 missing 2 games (90%)
4. Presses `m` to manage must-haves
5. Modal shows all 60+ series
6. Selects "PS1" series
7. Shows all 20 must-have PS1 games
8. Missing games highlighted (Tekken 3, Gran Turismo)
9. User presses `f` to find in library
10. TUI searches full library for matches
11. If found, adds to 128GB list
12. If not found, adds to "Wanted List"

**Integration**: Uses must-have series data from curation algorithm

### 5.5 Advanced Workflow: Duplicate Detection & Cleanup

**Goal**: Find and remove duplicate ROMs

**Steps**:
1. User opens Library Browser
2. Presses `:` for command mode
3. Types `find-dupes` and presses Enter
4. TUI scans library:
   - Groups by game title (ignoring region/version)
   - Calculates checksums (CRC32)
   - Identifies duplicates
5. Shows duplicate groups:
   ```
   Super Mario 64 (3 copies)
   ├─ (U) [!]      8.1 MB  CRC: ABC123  ← KEEP (best)
   ├─ (E)          8.2 MB  CRC: DEF456  ← Remove?
   └─ (J)          8.0 MB  CRC: GHI789  ← Remove?
   ```
6. User reviews, marks for removal
7. Confirms deletion
8. TUI removes selected duplicates

**Integration**: New feature, uses checksum verification

---

## 6. Data Architecture

### 6.1 Game Model

```typescript
interface Game {
  // File Information
  id: string;                    // UUID
  filename: string;              // Original filename
  path: string;                  // Absolute path
  size: number;                  // Bytes

  // Metadata
  title: string;                 // Clean title (no region)
  system: string;                // NES, SNES, GBA, etc.
  region: string;                // USA, Europe, Japan, World
  language?: string;             // En, Ja, Fr, etc.
  version?: string;              // Rev A, v1.1, etc.
  releaseDate?: string;          // YYYY-MM-DD

  // Quality Flags
  verified: boolean;             // [!] flag
  badDump: boolean;              // [b] flag
  hack: boolean;                 // [h] flag
  translation: boolean;          // [T+] flag

  // Curation
  priority: number;              // 0-9999 (lower = higher priority)
  favorite: boolean;
  inCuration: boolean;           // In 128GB list?
  onSDCard: boolean;             // Currently on SD card?
  mustHaveSeries?: string;       // e.g., "Pokemon", "Zelda"

  // Rich Metadata (Optional, from scraping)
  description?: string;
  genre?: string;
  developer?: string;
  publisher?: string;
  players?: string;              // "1-4"
  rating?: number;               // 0.0-1.0
  coverArt?: string;             // Path to image

  // Usage Statistics
  playcount: number;
  lastPlayed?: string;           // ISO timestamp

  // Hashes (for verification)
  crc32?: string;
  md5?: string;
  sha1?: string;

  // Timestamps
  createdAt: string;             // When added to library
  updatedAt: string;             // Last modified
}
```

### 6.2 Collection Model

```typescript
interface Collection {
  id: string;
  name: string;
  description: string;
  maxSize?: number;              // Bytes (e.g., 120GB for 128GB cards)
  games: string[];               // Game IDs
  totalSize: number;             // Calculated total

  // Metadata
  createdAt: string;
  updatedAt: string;
  lastFlashed?: string;          // When last flashed to SD
}
```

### 6.3 Configuration Model

```typescript
interface AppConfig {
  paths: {
    library: string;             // /Volumes/Tony's T5/Roms/1G1R_Library
    downloads: string;           // ~/Downloads
    sdCard?: string;             // /Volumes/ARKOS
    spreadsheets: string;        // /Volumes/Tony's T5/Roms/
  };

  preferences: {
    regionPriority: string[];    // ['USA', 'World', 'Europe', 'Japan']
    autoScanDownloads: boolean;
    confirmDestructive: boolean;
    defaultCollection: string;   // Collection ID
  };

  mustHaveSeries: {
    [system: string]: string[];  // { 'GBA': ['Pokemon', 'Zelda', ...] }
  };

  theme: {
    colorScheme: 'dark' | 'light';
    accentColor: string;
  };
}
```

### 6.4 Database Schema (SQLite)

**Purpose**: Fast querying and indexing for large libraries

```sql
-- Games table
CREATE TABLE games (
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

-- Indexes
CREATE INDEX idx_system ON games(system);
CREATE INDEX idx_title ON games(title);
CREATE INDEX idx_region ON games(region);
CREATE INDEX idx_favorite ON games(favorite);
CREATE INDEX idx_priority ON games(priority);
CREATE INDEX idx_crc32 ON games(crc32);
CREATE INDEX idx_must_have ON games(must_have_series);

-- Full-text search
CREATE VIRTUAL TABLE games_fts USING fts5(
  title,
  filename,
  description,
  content='games',
  content_rowid='id'
);

-- Collections table
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  max_size INTEGER,
  total_size INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_flashed TEXT
);

-- Collection games (many-to-many)
CREATE TABLE collection_games (
  collection_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  added_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, game_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id),
  FOREIGN KEY (game_id) REFERENCES games(id)
);
```

---

## 7. Integration Layer

### 7.1 Python Script Wrappers

**Purpose**: Call existing Python scripts from TUI

```typescript
// src/integrations/scanner.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

const execAsync = promisify(exec);

export async function scanDownloads(
  downloadsPath: string,
  scriptsDir: string
): Promise<ScanResult> {
  const scriptPath = join(scriptsDir, 'scan_new_downloads.py');
  const cmd = `python3 ${scriptPath} --downloads ${downloadsPath} --json`;

  const { stdout } = await execAsync(cmd);
  return JSON.parse(stdout);
}

export async function addToLibrary(
  games: string[],
  libraryPath: string,
  scriptsDir: string
): Promise<AddResult> {
  const scriptPath = join(scriptsDir, 'add_gaps_to_library.py');
  const filesArg = games.join(',');
  const cmd = `python3 ${scriptPath} --files "${filesArg}" --library ${libraryPath}`;

  const { stdout } = await execAsync(cmd);
  return JSON.parse(stdout);
}
```

### 7.2 Configuration Loader

```typescript
// src/models/config.ts
import { readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'yaml';

export class ConfigManager {
  private config: AppConfig;
  private configPath: string;

  constructor(configPath: string = './config.yaml') {
    this.configPath = configPath;
    this.load();
  }

  load(): void {
    const yaml = readFileSync(this.configPath, 'utf-8');
    this.config = parse(yaml);
  }

  save(): void {
    const yaml = stringify(this.config);
    writeFileSync(this.configPath, yaml);
  }

  get(key: string): any {
    return key.split('.').reduce((obj, k) => obj[k], this.config);
  }

  set(key: string, value: any): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    const obj = keys.reduce((obj, k) => obj[k], this.config);
    obj[lastKey] = value;
    this.save();
  }
}
```

### 7.3 Library Scanner

```typescript
// src/models/library.ts
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

export class LibraryManager {
  private db: Database;  // SQLite connection
  private config: AppConfig;

  async scanLibrary(): Promise<void> {
    const libraryPath = this.config.paths.library;
    const systems = readdirSync(libraryPath);

    for (const system of systems) {
      const systemPath = join(libraryPath, system);
      if (!statSync(systemPath).isDirectory()) continue;

      await this.scanSystem(system, systemPath);
    }
  }

  private async scanSystem(system: string, path: string): Promise<void> {
    const files = readdirSync(path, { recursive: true });

    for (const file of files) {
      if (!this.isROMFile(file)) continue;

      const fullPath = join(path, file);
      const game = this.parseGame(fullPath, system);

      await this.db.upsertGame(game);
    }
  }

  private isROMFile(filename: string): boolean {
    const extensions = ['.gba', '.gbc', '.gb', '.nes', '.sfc', '.smc',
                       '.z64', '.n64', '.nds', '.md', '.gen', '.gg',
                       '.7z', '.zip', '.chd', '.pbp', '.iso', '.cso'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  private parseGame(path: string, system: string): Game {
    // Parse filename using GoodTools convention
    const filename = path.split('/').pop()!;

    // Extract metadata from filename
    const titleMatch = filename.match(/^([^(]+)/);
    const regionMatch = filename.match(/\(([^)]+)\)/);
    const verifiedMatch = filename.match(/\[!\]/);
    const badDumpMatch = filename.match(/\[b\]/);

    return {
      id: generateUUID(),
      filename,
      path,
      size: statSync(path).size,
      title: titleMatch ? titleMatch[1].trim() : filename,
      system,
      region: this.parseRegion(regionMatch?.[1]),
      verified: !!verifiedMatch,
      badDump: !!badDumpMatch,
      priority: 9999,  // Default, can be updated
      favorite: false,
      inCuration: false,
      onSDCard: false,
      playcount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private parseRegion(regionStr?: string): string {
    if (!regionStr) return 'Unknown';
    if (regionStr.includes('U') || regionStr.includes('USA')) return 'USA';
    if (regionStr.includes('E') || regionStr.includes('Europe')) return 'Europe';
    if (regionStr.includes('J') || regionStr.includes('Japan')) return 'Japan';
    if (regionStr.includes('W') || regionStr.includes('World')) return 'World';
    return regionStr;
  }
}
```

---

## 8. Performance Strategy

### 8.1 Lazy Loading

**Problem**: Loading 7,300 games at startup is slow

**Solution**: Virtualized scrolling + on-demand loading

```typescript
// Only load visible items
function GameList({ games }: { games: Game[] }) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });

  const visibleGames = games.slice(visibleRange.start, visibleRange.end);

  return (
    <scrollbox
      viewportCulling
      onScroll={(offset) => {
        const itemsPerScreen = 30;
        const start = Math.floor(offset / itemHeight) - itemsPerScreen;
        const end = start + (itemsPerScreen * 3);
        setVisibleRange({ start: Math.max(0, start), end });
      }}
    >
      {visibleGames.map(game => <GameListItem key={game.id} game={game} />)}
    </scrollbox>
  );
}
```

### 8.2 Database Indexing

**Problem**: Filtering 7,300 games by system is slow

**Solution**: SQLite indexes on commonly filtered fields

- Index on `system` for system filtering
- Index on `title` for alphabetical sorting
- Index on `priority` for curation views
- Full-text search index for search

### 8.3 Async Operations

**Problem**: Long-running operations block UI

**Solution**: Background threads + progress updates

```typescript
async function flashSDCard(collection: Collection, sdPath: string) {
  const total = collection.games.length;
  let completed = 0;

  // Show progress modal
  showProgress({
    title: 'Flashing SD Card',
    total,
    onCancel: () => cancelFlash(),
  });

  for (const gameId of collection.games) {
    const game = await db.getGame(gameId);

    // Copy file (async)
    await copyFile(game.path, join(sdPath, 'roms', game.system, game.filename));

    // Update progress
    completed++;
    updateProgress({
      completed,
      current: game.filename,
      speed: calculateSpeed(),
      eta: calculateETA(completed, total),
    });
  }

  hideProgress();
  showNotification('Flash complete!');
}
```

### 8.4 Caching Strategy

**In-Memory Cache**: Current view's games (e.g., selected system)
**SQLite Cache**: Full library metadata
**Filesystem Cache**: Avoid re-scanning unchanged directories

```typescript
class GameCache {
  private cache: Map<string, Game[]> = new Map();

  async getSystem(system: string): Promise<Game[]> {
    if (this.cache.has(system)) {
      return this.cache.get(system)!;
    }

    const games = await db.getGamesBySystem(system);
    this.cache.set(system, games);
    return games;
  }

  invalidate(system?: string): void {
    if (system) {
      this.cache.delete(system);
    } else {
      this.cache.clear();
    }
  }
}
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goals**: Basic navigation and data layer

- [x] Project structure setup
- [ ] SQLite database schema
- [ ] Configuration management (YAML)
- [ ] Library scanner (filesystem → DB)
- [ ] Game model and parsing
- [ ] Dashboard screen (read-only)
- [ ] Library browser (read-only)
- [ ] Search functionality

**Deliverables**:
- Can browse library by system
- Can search for games
- Can view game details
- Dashboard shows accurate stats

### Phase 2: Downloads Integration (Week 3)

**Goals**: Integrate existing Python scripts

- [ ] Downloads scanner wrapper
- [ ] Downloads Manager screen
- [ ] Categorization display
- [ ] Import workflow
- [ ] Progress indicators
- [ ] Success/error notifications

**Deliverables**:
- Can scan ~/Downloads
- Can review new games
- Can import to library
- Integration with `scan_new_downloads.py` and `add_gaps_to_library.py`

### Phase 3: Curation Studio (Week 4)

**Goals**: 128GB collection management

- [ ] Curation algorithm wrapper
- [ ] Curation Studio screen
- [ ] Space visualization
- [ ] Must-have series tracker
- [ ] Auto-build workflow
- [ ] Manual curation tools
- [ ] Export to Excel

**Deliverables**:
- Can build 128GB collection automatically
- Can manually adjust collection
- Can track must-have series coverage
- Integration with `build_128gb_favorites.py`

### Phase 4: SD Card Manager (Week 5-6)

**Goals**: SD card detection and flashing

- [ ] SD card detection
- [ ] Filesystem analysis
- [ ] Flash workflow
- [ ] Progress tracking
- [ ] Save state backup/restore
- [ ] Verification (checksums)
- [ ] Safe eject

**Deliverables**:
- Can detect SD cards
- Can flash collections to SD card
- Can backup/restore saves
- Integration with `copy_to_sd_card.py`

### Phase 5: Polish & Features (Week 7-8)

**Goals**: Quality of life improvements

- [ ] Duplicate detection
- [ ] Batch operations
- [ ] Metadata editor
- [ ] Theme customization
- [ ] Keyboard shortcuts help overlay
- [ ] Error handling improvements
- [ ] Performance optimizations

**Deliverables**:
- Smooth UX with large libraries
- Comprehensive keyboard navigation
- Beautiful, polished UI
- Comprehensive help documentation

### Phase 6: Advanced Features (Future)

**Goals**: Power user features

- [ ] ScreenScraper integration
- [ ] Cover art download/management
- [ ] gamelist.xml import/export
- [ ] 1G1R filtering UI
- [ ] Custom collection builder
- [ ] Statistics and reports
- [ ] Automated backups

---

## Appendix A: Color Palette

**Dark Theme** (Default):
```
Background:     #1f2933  (Dark blue-gray)
Surface:        #2d3748  (Lighter blue-gray)
Border:         #4a5568  (Medium gray)
Text Primary:   #e2e8f0  (Light gray)
Text Secondary: #a0aec0  (Medium gray)
Accent:         #4299e1  (Blue)
Success:        #48bb78  (Green)
Warning:        #ed8936  (Orange)
Error:          #f56565  (Red)
Highlight:      #805ad5  (Purple)
```

**Component Colors**:
- **USA Region**: `#48bb78` (Green)
- **Europe**: `#4299e1` (Blue)
- **Japan**: `#ed8936` (Orange)
- **World**: `#805ad5` (Purple)
- **Verified [!]**: `#48bb78` (Green)
- **Bad Dump [b]**: `#f56565` (Red)

---

## Appendix B: Keyboard Shortcuts Reference

### Global Shortcuts

| Key | Action |
|-----|--------|
| `/` | Search |
| `?` | Help overlay |
| `Esc` | Cancel/Back |
| `q` | Quit/Back (context-dependent) |
| `:` | Command mode (vim-style) |
| `Ctrl+C` | Force quit |

### Navigation

| Key | Action |
|-----|--------|
| `h` / `←` | Previous panel/tab |
| `l` / `→` | Next panel/tab |
| `j` / `↓` | Move down |
| `k` / `↑` | Move up |
| `g` | Go to top |
| `G` | Go to bottom |
| `Ctrl+d` | Page down |
| `Ctrl+u` | Page up |

### View Shortcuts

| Key | Action |
|-----|--------|
| `H` | Home (Dashboard) |
| `L` | Library Browser |
| `D` | Downloads Manager |
| `C` | Curation Studio |
| `S` | SD Card Manager |
| `M` | Metadata Editor |
| `,` | Settings |

### Actions

| Key | Action |
|-----|--------|
| `Enter` | Select/Open/Confirm |
| `Space` | Toggle checkbox (multi-select) |
| `e` | Edit |
| `d` | Delete |
| `f` | Toggle favorite |
| `a` | Select all |
| `n` | Deselect all |

### Downloads Manager

| Key | Action |
|-----|--------|
| `r` | Rescan downloads |
| `i` | Import selected |
| `p` | Preview (dry-run) |

### Curation Studio

| Key | Action |
|-----|--------|
| `a` | Auto-build collection |
| `m` | Manage must-haves |
| `s` | Save collection |
| `x` | Export to Excel |
| `F` | Flash to SD card |

### SD Card Manager

| Key | Action |
|-----|--------|
| `f` | Flash collection |
| `b` | Backup saves |
| `r` | Restore saves |
| `e` | Eject card |
| `v` | View contents |

---

**End of Design Specification**

This comprehensive architecture provides a complete blueprint for implementing a beautiful, powerful, and intuitive ROM Manager TUI tailored specifically to your workflows, existing automation, and the broader retro gaming ecosystem standards.
