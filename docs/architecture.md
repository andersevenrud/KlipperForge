# Architecture

## Overview

KlipperForge is an offline-first web application for generating Klipper 3D printer configurations. The frontend runs entirely in the browser with no backend required. An optional firmware build server compiles Klipper binaries in sandboxed Docker containers.

## Tech Stack

- **Framework**: React 19 + TypeScript (strict mode)
- **Build**: Vite 7 with SWC
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Editor**: CodeMirror 6 with custom Klipper syntax highlighting
- **Layout**: react-resizable-panels
- **Forms**: React Hook Form + Zod
- **State**: React Context + useReducer
- **Data Fetching**: React Query (TanStack Query)
- **Testing**: Vitest
- **Linting**: Biome
- **Package Manager**: Bun

## Monorepo Structure

```
KlipperForge/
├── apps/
│   ├── klipperforge/         # Vite + React frontend
│   ├── firmware/             # Bun + Hono firmware build server
│   ├── configs/              # Config sharing/browsing app
│   └── pcb/                  # PCB layout editor
├── packages/
│   ├── klipper-config/       # Config parsing, generation, validation
│   ├── printer-data/         # Typed loaders for JSON database
│   ├── editor/               # CodeMirror editor components
│   ├── configparser/         # Klipper config file parser
│   └── dfu/                  # DFU flashing utilities
├── data/                     # JSON database (printers, equipment, macros)
└── docs/                     # Documentation
```

## Data Flow

1. User makes selections in the config panel (left sidebar)
2. Selections dispatch actions to the React Context reducer
3. The reducer updates the `ConfigDocument` state
4. The serializer generates output per file, building source maps
5. The CodeMirror editor displays the generated config with syntax highlighting
6. Clicking in the editor scrolls the corresponding form field into view (and vice versa)
7. Validation runs on every change, surfacing errors and warnings inline

## Multi-File Support

Configurations can span multiple files (e.g., `printer.cfg`, `macros.cfg`). Each `SectionInstance` has an optional `file` property. The serializer groups sections by file, generates `[include]` directives in the main file, and produces a `Map<filename, content>` for the editor tabs.

## Packages

### @klipperforge/klipper-config

Core library for working with Klipper configuration:
- **Section definitions** with param types, Zod schemas, and visibility rules
- **Parser** for Klipper INI-like format into structured `ConfigDocument`
- **Serializer** with source maps for editor synchronization
- **Validator** for completeness, type checking, and cross-section rules
- **Normalizer** for cleaning form data before dispatch

### @klipperforge/printer-data

Data layer for loading from the JSON database:
- Typed interfaces for presets, equipment, macros, boards
- Async fetch-based loaders

### @klipperforge/editor

CodeMirror-based editor components:
- `ConfigEditor` — main editor with validation decorations, override markers, diff highlighting, and inline editing
- `JsonViewer` — read-only JSON display
- Editor scroll context for bidirectional form-editor synchronization

## UI Layout

The app uses a three-panel split view:
- **Left**: Scrollable config panel with section editors, equipment selection, and macro management
- **Top-right**: SVG printer illustration (changes by kinematics) or PCB board viewer
- **Bottom-right**: Tabbed CodeMirror editor with per-file tabs

All panels are resizable via drag handles.
