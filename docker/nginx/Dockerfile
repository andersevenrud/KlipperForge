FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy workspace package.json files for dependency caching
COPY package.json bun.lock tsconfig.json ./
COPY apps/klipperforge/package.json apps/klipperforge/
COPY apps/firmware/package.json apps/firmware/
COPY apps/configs/package.json apps/configs/
COPY apps/pcb/package.json apps/pcb/
COPY packages/configparser/package.json packages/configparser/
COPY packages/klipper-config/package.json packages/klipper-config/
COPY packages/printer-data/package.json packages/printer-data/
COPY packages/dfu/package.json packages/dfu/
COPY packages/editor/package.json packages/editor/
COPY packages/theme/package.json packages/theme/
COPY packages/moonraker/package.json packages/moonraker/

RUN bun install --frozen-lockfile --ignore-scripts

# Copy data and scripts needed for build
COPY data/ data/
COPY scripts/ scripts/

# Copy all packages (frontend imports them at build time)
COPY packages/ packages/

# Copy frontend app source
COPY apps/klipperforge/ apps/klipperforge/

# Generate doc indices (before copying data to public/)
RUN bun run scripts/build-doc-indices.ts

# Replace symlink with real copy (Docker copies symlinks as-is)
RUN rm -f apps/klipperforge/public/data && cp -r data apps/klipperforge/public/data

# Copy PCB editor source
COPY apps/pcb/ apps/pcb/

# Build frontend and PCB editor
RUN cd apps/klipperforge && bun run build
RUN cd apps/pcb && bun run build

# ---

FROM nginx:alpine AS production

COPY --from=builder /app/apps/klipperforge/dist/ /usr/share/nginx/html/
COPY --from=builder /app/apps/pcb/dist/ /usr/share/nginx/html/pcb-designer/
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
