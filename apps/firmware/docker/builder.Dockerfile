FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc-arm-none-eabi binutils-arm-none-eabi \
    libnewlib-arm-none-eabi gcc-avr binutils-avr avr-libc \
    python3 python3-dev libffi-dev libncurses-dev make git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /klipper
