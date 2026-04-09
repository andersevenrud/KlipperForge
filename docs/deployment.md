# Deployment

Production deployment uses Docker Compose to run the frontend (nginx), firmware build server, and config storage backend.

## Prerequisites

- Docker
- Git
- A domain name (optional, for HTTPS)

## Environment Setup

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description |
|---|---|
| `SESSION_SECRET` | Random string for encrypting session cookies. Generate with `openssl rand -hex 32`. |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID (see below) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret (see below) |
| `APP_URL` | Public URL of the application (e.g., `https://klipperforge.example.com`) |
| `GITHUB_CALLBACK_URL` | OAuth callback URL: `<APP_URL>/api/auth/github/callback` |

### Optional Variables

| Variable | Default | Description |
|---|---|---|
| `APP_PORT` | `80` | Host port nginx listens on |
| `MAX_CONCURRENT_BUILDS` | `2` | Parallel firmware build slots |
| `MAX_PENDING_BUILDS` | `20` | Max queued firmware builds |
| `BUILD_TIMEOUT_MS` | `120000` | Per-build timeout (ms) |
| `FIRMWARE_RATE_LIMIT_MAX_REQUESTS` | `5` | Firmware API requests per window per IP |
| `FIRMWARE_RATE_LIMIT_WINDOW_SECONDS` | `60` | Firmware rate limit window |
| `CONFIGS_RATE_LIMIT_MAX_REQUESTS` | `30` | Config API requests per window per IP |
| `CONFIGS_RATE_LIMIT_WINDOW_SECONDS` | `60` | Config rate limit window |
| `CACHE_MAX_ENTRIES` | `500` | Max cached firmware builds |
| `CACHE_MAX_SIZE_MB` | `200` | Max firmware cache size (MB) |
| `CACHE_TTL_SECONDS` | `604800` | Firmware cache TTL (7 days) |
| `CACHE_EVICT_STALE_COMMITS` | `true` | Evict builds from outdated Klipper commits |
| `MAX_CONFIGS_PER_USER` | `50` | Max saved configs per user |
| `MAX_REVISIONS_PER_CONFIG` | `100` | Max revisions per config |
| `MAX_DOCUMENT_SIZE_BYTES` | `65536` | Max config document size (64 KB) |
| `SESSION_MAX_AGE_DAYS` | `30` | Session cookie lifetime |
| `VITE_FEATURE_ANALYTICS` | `true` | Enable SimpleAnalytics tracking |

## GitHub OAuth Setup

Config storage requires GitHub OAuth for user authentication.

1. Go to [GitHub Developer Settings](https://github.com/settings/developers) and create a new OAuth app
2. Set the homepage URL to your `APP_URL`
3. Set the authorization callback URL to `<APP_URL>/api/auth/github/callback`
4. Copy the client ID and client secret into `.env`

## Starting the Stack

```bash
docker compose up -d
```

On first run, init services automatically:

1. **klipper-init** — clones the Klipper source repository (~50 MB shallow clone)
2. **builder-init** — builds the `klipperforge-builder` Docker image (~1.5 GB)

These run once and exit. Subsequent starts skip them if the data already exists.

Once init completes, the remaining services start:

- **nginx** — serves the frontend SPA and proxies API requests
- **firmware** — firmware build server (port 3001 internal)
- **configs** — config storage backend (port 3002 internal)
- **klipper-updater** — pulls Klipper source updates nightly at 3 AM UTC

## Services

### nginx

Builds the frontend SPA and PCB editor, then serves them as static files. Proxies `/api/firmware/*` to the firmware service and `/api/*` to the configs service.

### firmware

Compiles Klipper firmware in sandboxed Docker containers. Requires access to the Docker socket. Stores build artifacts and metadata in SQLite.

### configs

Stores user configurations with GitHub OAuth authentication. Uses SQLite for persistence.

### klipper-updater

Runs as a cron job inside the container, fetching the latest Klipper source daily. Firmware builds always compile against the current Klipper commit.

## Volumes

| Volume | Purpose |
|---|---|
| `klipper-source` | Klipper git repository |
| `firmware-builds` | Compiled firmware binaries |
| `firmware-db` | Firmware service SQLite database |
| `configs-db` | Config service SQLite database |

## Checking Status

```bash
# View running services
docker compose ps

# View logs
docker compose logs -f

# View logs for a specific service
docker compose logs -f firmware
```

## Updating

Pull the latest code and rebuild:

```bash
git pull
docker compose up -d --build
```

The `--build` flag rebuilds the nginx and service images. Docker volumes persist data across rebuilds.

## HTTPS

The default setup serves HTTP on port 80. For HTTPS, we recommend using [Caddy](https://caddyserver.com/) as a reverse proxy — it handles TLS certificates automatically.

1. Change the nginx port in `.env` to avoid conflicting with Caddy:

   ```bash
   APP_PORT=8080
   ```

2. Update `APP_URL` and `GITHUB_CALLBACK_URL` to use `https://`:

   ```bash
   APP_URL=https://klipperforge.example.com
   GITHUB_CALLBACK_URL=https://klipperforge.example.com/api/auth/github/callback
   ```

3. Add a Caddyfile:

   ```
   klipperforge.example.com {
       reverse_proxy localhost:8080
   }
   ```

4. Start Caddy:

   ```bash
   caddy run
   ```
