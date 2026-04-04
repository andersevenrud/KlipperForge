/// <reference types="@types/w3c-web-serial" />
import type { FlashOptions, FlashProgress, FlashResult } from "./types";

// STM32 UART bootloader protocol constants (AN3155)
const SYNC_BYTE = 0x7f;
const ACK = 0x79;
const NACK = 0x1f;

const CMD_GET = 0x00;
const CMD_ERASE = 0x43;
const CMD_EXTENDED_ERASE = 0x44;
const CMD_WRITE_MEMORY = 0x31;
const CMD_GO = 0x21;

const WRITE_CHUNK_SIZE = 256;
const READ_TIMEOUT_MS = 5000;

interface SerialFlashConfig {
  baudRate: number;
  parity: ParityType;
}

export async function requestSerialPort(): Promise<SerialPort> {
  return navigator.serial.requestPort({
    filters: [{ usbVendorId: 0x0483 }],
  });
}

async function readByte(reader: ReadableStreamDefaultReader<Uint8Array>, timeoutMs = READ_TIMEOUT_MS): Promise<number> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Serial read timeout")), timeoutMs);
  });

  const readPromise = reader.read().then((result) => {
    if (result.done || !result.value || result.value.length === 0) {
      throw new Error("Serial port closed unexpectedly");
    }
    return result.value[0];
  });

  return Promise.race([readPromise, timeoutPromise]);
}

async function waitForAck(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  const byte = await readByte(reader);
  if (byte === NACK) {
    throw new Error("Received NACK from bootloader");
  }
  if (byte !== ACK) {
    throw new Error(`Expected ACK (0x79), got 0x${byte.toString(16)}`);
  }
}

async function sendCommand(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  reader: ReadableStreamDefaultReader<Uint8Array>,
  command: number,
): Promise<void> {
  await writer.write(new Uint8Array([command, command ^ 0xff]));
  await waitForAck(reader);
}

function computeChecksum(data: Uint8Array): number {
  let xor = 0;
  for (let i = 0; i < data.length; i++) {
    xor ^= data[i];
  }
  return xor;
}

async function writeMemory(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  reader: ReadableStreamDefaultReader<Uint8Array>,
  address: number,
  data: Uint8Array,
): Promise<void> {
  await sendCommand(writer, reader, CMD_WRITE_MEMORY);

  // Send address (4 bytes + checksum)
  const addrBytes = new Uint8Array([
    (address >> 24) & 0xff,
    (address >> 16) & 0xff,
    (address >> 8) & 0xff,
    address & 0xff,
  ]);
  const addrChecksum = computeChecksum(addrBytes);
  await writer.write(new Uint8Array([...addrBytes, addrChecksum]));
  await waitForAck(reader);

  // Send data (length-1 byte + data + checksum)
  const lengthByte = data.length - 1;
  const payload = new Uint8Array(1 + data.length + 1);
  payload[0] = lengthByte;
  payload.set(data, 1);
  payload[payload.length - 1] = lengthByte ^ computeChecksum(data);
  await writer.write(payload);
  await waitForAck(reader);
}

async function eraseAll(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  reader: ReadableStreamDefaultReader<Uint8Array>,
  supportsExtendedErase: boolean,
): Promise<void> {
  if (supportsExtendedErase) {
    await sendCommand(writer, reader, CMD_EXTENDED_ERASE);
    // Global mass erase: 0xFFFF + checksum
    await writer.write(new Uint8Array([0xff, 0xff, 0x00]));
    await waitForAck(reader);
  } else {
    await sendCommand(writer, reader, CMD_ERASE);
    // Global erase: 0xFF + checksum
    await writer.write(new Uint8Array([0xff, 0x00]));
    await waitForAck(reader);
  }
}

async function goToAddress(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  reader: ReadableStreamDefaultReader<Uint8Array>,
  address: number,
): Promise<void> {
  await sendCommand(writer, reader, CMD_GO);

  const addrBytes = new Uint8Array([
    (address >> 24) & 0xff,
    (address >> 16) & 0xff,
    (address >> 8) & 0xff,
    address & 0xff,
  ]);
  const checksum = computeChecksum(addrBytes);
  await writer.write(new Uint8Array([...addrBytes, checksum]));
  await waitForAck(reader);
}

export async function flashSerial(
  port: SerialPort,
  firmware: Uint8Array,
  flashAddress: string,
  config: SerialFlashConfig,
  options?: FlashOptions,
): Promise<FlashResult> {
  const startTime = Date.now();
  const address = Number.parseInt(flashAddress, 16);
  const totalBytes = firmware.length;

  function reportProgress(progress: Partial<FlashProgress>): void {
    options?.onProgress?.({
      phase: "connecting",
      percent: 0,
      bytesWritten: 0,
      totalBytes,
      message: "",
      ...progress,
    });
  }

  try {
    // Connect
    reportProgress({ phase: "connecting", message: "Opening serial port..." });
    await port.open({
      baudRate: config.baudRate,
      dataBits: 8,
      stopBits: 1,
      parity: config.parity,
    });

    if (!port.readable || !port.writable) {
      throw new Error("Serial port streams not available");
    }

    const reader = port.readable.getReader();
    const writer = port.writable.getWriter();

    try {
      // Sync with bootloader
      reportProgress({ phase: "connecting", message: "Syncing with bootloader..." });
      await writer.write(new Uint8Array([SYNC_BYTE]));
      await waitForAck(reader);

      // Get supported commands to determine erase type
      reportProgress({ phase: "connecting", message: "Reading bootloader info..." });
      await sendCommand(writer, reader, CMD_GET);

      // Read the GET response: number of bytes, bootloader version, command list, ACK
      const numBytes = await readByte(reader);
      await readByte(reader); // bootloader version
      const commands: number[] = [];
      for (let i = 0; i < numBytes; i++) {
        commands.push(await readByte(reader));
      }
      await waitForAck(reader);

      const supportsExtendedErase = commands.includes(CMD_EXTENDED_ERASE);

      // Erase
      reportProgress({ phase: "erasing", message: "Erasing flash..." });
      await eraseAll(writer, reader, supportsExtendedErase);

      // Write
      let bytesWritten = 0;
      while (bytesWritten < firmware.length) {
        if (options?.signal?.aborted) {
          throw new Error("Flash cancelled");
        }

        const chunkSize = Math.min(WRITE_CHUNK_SIZE, firmware.length - bytesWritten);
        const chunk = firmware.slice(bytesWritten, bytesWritten + chunkSize);

        // Pad to multiple of 4 if needed
        let paddedChunk = chunk;
        if (chunk.length % 4 !== 0) {
          const padded = new Uint8Array(Math.ceil(chunk.length / 4) * 4);
          padded.fill(0xff);
          padded.set(chunk);
          paddedChunk = padded;
        }

        await writeMemory(writer, reader, address + bytesWritten, paddedChunk);

        bytesWritten += chunkSize;
        reportProgress({
          phase: "writing",
          percent: Math.round((bytesWritten / firmware.length) * 100),
          bytesWritten,
          message: `Writing ${bytesWritten}/${firmware.length} bytes...`,
        });
      }

      // Go to application
      reportProgress({ phase: "complete", percent: 100, bytesWritten: totalBytes, message: "Flash complete!" });

      try {
        await goToAddress(writer, reader, address);
      } catch {
        // Device may reset before we get ACK
      }
    } finally {
      reader.releaseLock();
      writer.releaseLock();
    }

    await port.close();

    return {
      success: true,
      duration: Date.now() - startTime,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";

    reportProgress({
      phase: "error",
      percent: 0,
      bytesWritten: 0,
      message: error,
    });

    try {
      await port.close();
    } catch {
      // Ignore cleanup errors
    }

    return {
      success: false,
      error,
      duration: Date.now() - startTime,
    };
  }
}
