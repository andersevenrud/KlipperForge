FROM oven/bun:1-alpine AS build

WORKDIR /app

# Copy workspace package.json files for dependency resolution
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

RUN bun install --frozen-lockfile --ignore-scripts

# Copy workspace packages needed by firmware service
COPY packages/configparser/ packages/configparser/
COPY packages/klipper-config/ packages/klipper-config/
COPY packages/printer-data/ packages/printer-data/

# Copy firmware service
COPY apps/firmware/package.json apps/firmware/tsconfig.json apps/firmware/
COPY apps/firmware/src/ apps/firmware/src/

FROM oven/bun:1-distroless

WORKDIR /app
COPY --from=build /app/ ./

EXPOSE 3001
ENTRYPOINT ["bun", "run"]
CMD ["apps/firmware/src/index.ts"]
