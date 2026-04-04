# Contributing

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- Node.js 20+ (for compatibility)
- Docker or OrbStack (for firmware builds only)

## Setup

```bash
git clone <repo-url>
cd KlipperForge
bun install
```

## Development

```bash
bun run dev          # Start Vite dev server + firmware server
bun run build        # Production build
bun run test         # Run tests
bun run lint         # Check linting
bun run lint:fix     # Auto-fix lint issues
bun run typecheck    # TypeScript check
bun run knip         # Dead code detection
```

## Conventions

- **Indentation**: Spaces (enforced by Biome)
- **Quotes**: Double quotes
- **Semicolons**: Always
- **Imports**: Sorted alphabetically, no file extensions (enforced by Biome)
- **Commits**: Conventional Commits format (enforced by commitlint)
- **Components**: Hooks, callbacks, data transforms, effects, return (in that order)
- **Forms**: React Hook Form + Zod via FieldWrapper render prop pattern

See [CLAUDE.md](../CLAUDE.md) for the full conventions reference.

## Adding Data

See [adding-definitions.md](adding-definitions.md) for how to add printers, boards, equipment, macros, and firmware presets to the JSON database.
