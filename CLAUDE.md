# KlipperForge - Project Conventions

## Quick Reference

- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **Indentation**: Spaces
- **Quotes**: Double quotes
- **Semicolons**: Always
- **Import style**: No file extensions in imports, sorted alphabetically
- **Linter/Formatter**: Biome (`bun run lint`, `bun run lint:fix`)
- **Tests**: Vitest (`bun run test`)
- **Commits**: Conventional Commits (feat:, fix:, chore:, docs:, etc.)

## Commands

```bash
bun run dev          # Start Vite dev server + firmware server
bun run build        # Production build
bun run test         # Run all tests
bun run lint         # Biome check
bun run lint:fix     # Biome auto-fix
bun run typecheck    # TypeScript check (packages + app)
bun run knip         # Dead code detection
bun run firmware:dev # Start firmware server only (port 3001)
```

## Architecture

- Monorepo with Bun workspaces: `apps/*`, `packages/*`
- Frontend app: `apps/klipperforge/` (Vite + React + Tailwind v4 + shadcn/ui)
- Firmware build server: `apps/firmware/` (Bun + Hono + Docker)
- Config library: `packages/klipper-config/` (parser, generator, validator, types)
- Data layer: `packages/printer-data/` (typed JSON loaders)
- JSON database: `data/` (printers, equipment, macros)

## Firmware Build Service

The firmware tab compiles Klipper firmware in sandboxed Docker containers. Requires Docker (or OrbStack) running locally.

### Setup

```bash
# 1. Build the builder image (one-time, ~1.5 GB)
cd apps/firmware
docker build -t klipperforge-builder:latest -f docker/builder.Dockerfile .

# 2. Start both servers (Vite proxies /api/firmware → localhost:3001)
cd ../..
bun run dev
```

On first start, the firmware server clones the Klipper repo to `apps/firmware/data/klipper/` (shallow clone, ~50 MB). It updates every 6 hours automatically.

### Production (Docker Compose)

```bash
docker compose up
```

On first run, init services automatically clone the Klipper source and build the `klipperforge-builder` image (~1.5 GB). Subsequent runs skip these steps.

### How It Works

1. User selects board + interface in the Firmware tab
2. Frontend POSTs to `/api/firmware/builds` with board ID and options
3. Server generates a `.config` file from `data/firmware-presets/*.json`
4. Server spawns a hardened Docker container (no network, memory/CPU limits, read-only rootfs)
5. Container runs `make olddefconfig && make` against the Klipper source
6. Build output streams to the browser via SSE (`/api/builds/:id/stream`)
7. Compiled binary is cached in SQLite (keyed by config hash + Klipper commit)
8. User downloads the firmware file

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Docker daemon socket |
| `KLIPPER_SOURCE_PATH` | `./data/klipper` | Klipper git clone location |
| `BUILDER_IMAGE` | `klipperforge-builder:latest` | Docker image for builds |
| `MAX_CONCURRENT_BUILDS` | `2` | Parallel build slots |
| `MAX_PENDING_BUILDS` | `20` | Max queued builds |
| `BUILD_CPUS` | `1` | CPU cores per build container |
| `BUILD_MEMORY_MB` | `384` | Memory limit per build container (MB) |
| `BUILD_TIMEOUT_MS` | `120000` | Per-build timeout (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | `5` | Requests per window per IP |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Rate limit window |

### Firmware Presets

Preset JSON files in `data/firmware-presets/` define Kconfig options per MCU family. Board → preset resolution: load board JSON → read `mcu` field → match against preset `mcuPatterns`.

## State Management

React Context + useReducer in `apps/klipperforge/src/context/config-context.tsx`. State is a `ConfigState` shape: the current `ConfigDocument`, generated output strings (per file), source maps, validation errors, board pin aliases, and UI flags like `showHeader` and `omitDefaults`.

## Data Fetching (React Query)

All React Query hooks must live in `apps/klipperforge/src/hooks/use-queries.ts`. Never import `useQuery`, `useSuspenseQuery`, or `useSuspenseQueries` directly in components — always go through a named hook in `use-queries.ts`.

Conventions:
- Hook names end with `Query` (e.g., `useBoardIndexQuery`, `useDocDataQuery`)
- Query keys use named constants (e.g., `const BOARD_INDEX_QUERY_KEY = "loadMcuBoardIndex"`)
- Prefer `useSuspenseQuery` for data that must be present before rendering
- Use `useQuery` only when the query is conditional (`enabled`) or the data is optional

## Generated Files

Files in `packages/klipper-config/src/sections/generated/` are **never modified manually**. To change their content, update the extraction/generation scripts and re-run the pipeline:

```bash
bun run scripts/extract-klipper-source-types.ts  # 1. Extract types from Klipper Python source
bun run scripts/extract-klipper-params.ts         # 2. Extract params from Config_Reference.md
bun run scripts/generate-section-defs.ts          # 3. Generate .ts definitions from .json
```

`data/doc-indices.json` is generated by `scripts/build-doc-indices.ts` (runs automatically via `bun run dev` and `bun run build`). It merges all 12 `data/*/index.json` files into a single file for the documentation sidebar. Regenerate manually with `bun run build:indices`.

## PCB Layouts

PCB layout data lives in `data/pcb-layouts/`. Extract from annotated SVGs in `_docs/`:

```bash
bun run scripts/extract-pcb-layout.ts <input.svg> <board-id> [name] [--image path]
```

Example:

```bash
bun run scripts/extract-pcb-layout.ts _docs/pcb-btt-octopus-pro.svg btt-octopus-pro-1.1 "BTT Octopus Pro v1.1" --image _docs/Octopus_Pro_Title.png
```

The SVG must contain `<rect>` elements with `data-klipperforge-*` attributes (name, category, pins, pin-hints, orientation, rows).

## File Structure Order

Every `.ts`/`.tsx` file must follow this order:

1. **Imports** — one solid block, no blank lines between imports
2. **Interfaces and types** — define all types before use (TypeScript handles forward references)
3. **Constants**
4. **Functions**
5. **Classes**

## React Component Structure Order

Within a React component, follow this order:

1. **Hooks** — `useState`, `useQuery`, `useContext`, etc. at the top
2. **Callbacks** — `useCallback`, event handlers
3. **Data transformations** — derived state, computed values
4. **Effects** — `useEffect` as low as possible, just before the return
5. **Return statement**

### useEffect Rule

Always use named functions in `useEffect`:

```tsx
// Good
useEffect(function scrollToLocationEffect() {
  // ...
}, [deps]);

// Bad
useEffect(() => {
  // ...
}, [deps]);
```

## Fragments

Only use `<>...</>` (or `<Fragment>`) when returning multiple sibling elements without a parent wrapper. Do not wrap children in a fragment when they are already inside a single parent element.

```tsx
// Good — fragment needed, multiple siblings returned
return (
  <>
    <Header />
    <Main />
  </>
);

// Good — no fragment, parent element already wraps children
return (
  <Card>
    <Header />
    <Content />
  </Card>
);

// Bad — unnecessary fragment inside parent
return (
  <Card>
    <>
      <Header />
      <Content />
    </>
  </Card>
);
```

## Interface and Type Conventions

1. **Component props must use named interfaces** — `interface FooProps {}`, never inline object types in function signatures.
2. **Object shapes must be named interfaces** — no inline `{ foo: string; bar: number }` in interface fields, function params, generics, or `as` casts. Extract to a named interface.
3. **Reuse existing types** — use `Pick<>`, `Omit<>`, `extends`, or generics to derive from existing interfaces instead of duplicating shapes. Check `@klipperforge/printer-data` and `@klipperforge/klipper-config` for shared types like `PinUsage`, `McuBoardIndexEntry`, `McuBoardAssociation`, etc.
4. **Discriminated union type aliases are fine** — tagged unions like `type Action = { type: "A" } | { type: "B" }` stay as `type` aliases, not interfaces.
5. **`Record<string, T>` is fine** — standard utility types don't need extraction.
6. **Prefer `Type[]` over `Array<Type>`** — use shorthand array syntax consistently.

## Async Code

Always prefer `async`/`await` over Promise chains (`.then()`, `.catch()`, `.finally()`). Use `try`/`catch`/`finally` for error handling instead.

```ts
// Good
async function fetchData() {
  try {
    const result = await loadSomething();
    setState(result);
  } catch {
    setError("Failed to load");
  } finally {
    setLoading(false);
  }
}

// Bad
loadSomething()
  .then((result) => setState(result))
  .catch(() => setError("Failed to load"))
  .finally(() => setLoading(false));
```

Exceptions where `new Promise()` is acceptable:
- Wrapping callback-based APIs (e.g., `FileReader`, event emitters)
- Timeout patterns with `Promise.race()`

## Control Flow

Prefer `switch/case` over chains of `if/else-if` when branching on the same discriminant. Each `case` should `return` directly (no `break` needed).

```ts
// Good
switch (status) {
  case "queued":
    return <Queued />;
  case "building":
    return <Building />;
  case "completed":
    return <Completed />;
  default:
    return null;
}

// Bad
if (status === "queued") {
  return <Queued />;
} else if (status === "building") {
  return <Building />;
} else if (status === "completed") {
  return <Completed />;
}
return null;
```

## Key Patterns

- shadcn/ui components live in `apps/klipperforge/src/components/ui/`
- Config sections are in `apps/klipperforge/src/components/sections/`
- SVG illustrations are in `apps/klipperforge/src/components/svg/`
- Path alias `@/` maps to `apps/klipperforge/src/`
- All config generation goes through `serializeConfig()` (or `serializeMultiFileConfig()` / `serializeConfigWithSourceMap()`) from `@klipperforge/klipper-config`
