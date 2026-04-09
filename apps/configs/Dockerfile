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
COPY packages/theme/package.json packages/theme/
COPY packages/moonraker/package.json packages/moonraker/

RUN bun install --frozen-lockfile --ignore-scripts

# Copy configs service
COPY apps/configs/package.json apps/configs/tsconfig.json apps/configs/
COPY apps/configs/src/ apps/configs/src/

FROM oven/bun:1-distroless

WORKDIR /app
COPY --from=build /app/ ./

EXPOSE 3002
ENTRYPOINT ["bun", "run"]
CMD ["apps/configs/src/index.ts"]
