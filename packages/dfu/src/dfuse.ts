import { getSectorsToErase } from "./flash-sectors";
import type { FlashOptions, FlashProgress, FlashResult, TimerId } from "./types";

// DFU class-specific requests
const _DFU_DETACH = 0;
const DFU_DNLOAD = 1;
const DFU_UPLOAD = 2;
const DFU_GETSTATUS = 3;
const DFU_CLRSTATUS = 4;
const DFU_ABORT = 6;

// DfuSe commands (sent via DFU_DNLOAD with block 0)
const DFUSE_CMD_SET_ADDRESS = 0x21;
const DFUSE_CMD_ERASE = 0x41;

// DFU states
const DFU_STATE_IDLE = 2;
const DFU_STATE_DNBUSY = 4;
const DFU_STATE_DNLOAD_IDLE = 5;
const DFU_STATE_ERROR = 10;

// STM32 DFU USB filter
const STM32_DFU_VENDOR_ID = 0x0483;
const STM32_DFU_PRODUCT_ID = 0xdf11;

const DEFAULT_TRANSFER_SIZE = 1024;
const MIN_POLL_INTERVAL_MS = 100;
const WAIT_STATE_TIMEOUT_MS = 10_000;
const USB_TRANSFER_TIMEOUT_MS = 5_000;

const STATE_NAMES: Record<number, string> = {
  0: "appIDLE",
  1: "appDETACH",
  2: "dfuIDLE",
  3: "dfuDNLOAD-SYNC",
  4: "dfuDNBUSY",
  5: "dfuDNLOAD-IDLE",
  6: "dfuMANIFEST-SYNC",
  7: "dfuMANIFEST",
  8: "dfuMANIFEST-WAIT-RESET",
  9: "dfuUPLOAD-IDLE",
  10: "dfuERROR",
};

interface DfuStatus {
  status: number;
  pollTimeout: number;
  state: number;
}

function stateName(state: number): string {
  return STATE_NAMES[state] ?? `unknown(${state})`;
}

function log(msg: string): void {
  console.log(`[dfu] ${msg}`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: TimerId | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

const USB_GET_DESCRIPTOR = 0x06;
const USB_DT_CONFIG = 0x02;
const DFU_FUNCTIONAL_DESCRIPTOR_TYPE = 0x21;
const DFU_FUNCTIONAL_DESCRIPTOR_LENGTH = 9;

async function getTransferSize(device: USBDevice): Promise<number> {
  try {
    // Read full configuration descriptor to find DFU functional descriptor
    const result = await device.controlTransferIn(
      {
        requestType: "standard",
        recipient: "device",
        request: USB_GET_DESCRIPTOR,
        value: (USB_DT_CONFIG << 8) | 0,
        index: 0,
      },
      // First read to get total length
      4,
    );

    if (!result.data || result.data.byteLength < 4) {
      return DEFAULT_TRANSFER_SIZE;
    }

    const totalLength = result.data.getUint16(2, true);

    // Read the full descriptor
    const full = await device.controlTransferIn(
      {
        requestType: "standard",
        recipient: "device",
        request: USB_GET_DESCRIPTOR,
        value: (USB_DT_CONFIG << 8) | 0,
        index: 0,
      },
      totalLength,
    );

    if (!full.data) {
      return DEFAULT_TRANSFER_SIZE;
    }

    // Walk through descriptors to find DFU functional descriptor
    const data = new Uint8Array(full.data.buffer, full.data.byteOffset, full.data.byteLength);
    let offset = 0;

    while (offset + 2 <= data.length) {
      const bLength = data[offset];
      const bDescriptorType = data[offset + 1];

      if (bLength === 0) break;

      if (
        bDescriptorType === DFU_FUNCTIONAL_DESCRIPTOR_TYPE &&
        bLength >= DFU_FUNCTIONAL_DESCRIPTOR_LENGTH &&
        offset + DFU_FUNCTIONAL_DESCRIPTOR_LENGTH <= data.length
      ) {
        const view = new DataView(data.buffer, data.byteOffset + offset);
        const wTransferSize = view.getUint16(5, true);
        log(`DFU functional descriptor: wTransferSize=${wTransferSize}`);
        return wTransferSize > 0 ? wTransferSize : DEFAULT_TRANSFER_SIZE;
      }

      offset += bLength;
    }

    log("DFU functional descriptor not found, using default transfer size");
    return DEFAULT_TRANSFER_SIZE;
  } catch (err) {
    log(`Failed to read DFU descriptor: ${err instanceof Error ? err.message : err}`);
    return DEFAULT_TRANSFER_SIZE;
  }
}

export async function requestDfuDevice(): Promise<USBDevice> {
  return navigator.usb.requestDevice({
    filters: [{ vendorId: STM32_DFU_VENDOR_ID, productId: STM32_DFU_PRODUCT_ID }],
  });
}

async function getStatus(device: USBDevice, interfaceNumber: number): Promise<DfuStatus> {
  const result = await withTimeout(
    device.controlTransferIn(
      {
        requestType: "class",
        recipient: "interface",
        request: DFU_GETSTATUS,
        value: 0,
        index: interfaceNumber,
      },
      6,
    ),
    USB_TRANSFER_TIMEOUT_MS,
    "DFU getStatus timed out — device not responding",
  );

  if (!result.data || result.data.byteLength < 6) {
    throw new Error("Failed to get DFU status");
  }

  const status: DfuStatus = {
    status: result.data.getUint8(0),
    pollTimeout: result.data.getUint8(1) | (result.data.getUint8(2) << 8) | (result.data.getUint8(3) << 16),
    state: result.data.getUint8(4),
  };

  log(`getStatus → state=${stateName(status.state)} status=${status.status} pollTimeout=${status.pollTimeout}ms`);
  return status;
}

async function clearStatus(device: USBDevice, interfaceNumber: number): Promise<void> {
  log("clearStatus");
  await withTimeout(
    device.controlTransferOut({
      requestType: "class",
      recipient: "interface",
      request: DFU_CLRSTATUS,
      value: 0,
      index: interfaceNumber,
    }),
    USB_TRANSFER_TIMEOUT_MS,
    "DFU clearStatus timed out",
  );
}

async function dfuAbort(device: USBDevice, interfaceNumber: number): Promise<void> {
  log("abort");
  await withTimeout(
    device.controlTransferOut({
      requestType: "class",
      recipient: "interface",
      request: DFU_ABORT,
      value: 0,
      index: interfaceNumber,
    }),
    USB_TRANSFER_TIMEOUT_MS,
    "DFU abort timed out",
  );
}

async function controlTransferOut(
  device: USBDevice,
  interfaceNumber: number,
  request: number,
  value: number,
  data: BufferSource,
): Promise<USBOutTransferResult> {
  return withTimeout(
    device.controlTransferOut(
      {
        requestType: "class",
        recipient: "interface",
        request,
        value,
        index: interfaceNumber,
      },
      data,
    ),
    USB_TRANSFER_TIMEOUT_MS,
    `DFU transfer timed out (request=${request}, value=${value})`,
  );
}

async function controlTransferIn(
  device: USBDevice,
  interfaceNumber: number,
  request: number,
  value: number,
  length: number,
): Promise<USBInTransferResult> {
  return withTimeout(
    device.controlTransferIn(
      {
        requestType: "class",
        recipient: "interface",
        request,
        value,
        index: interfaceNumber,
      },
      length,
    ),
    USB_TRANSFER_TIMEOUT_MS,
    `DFU transfer timed out (request=${request}, value=${value})`,
  );
}

async function pollUntil(
  device: USBDevice,
  interfaceNumber: number,
  predicate: (state: number) => boolean,
  signal?: AbortSignal,
): Promise<DfuStatus> {
  const deadline = Date.now() + WAIT_STATE_TIMEOUT_MS;
  let status = await getStatus(device, interfaceNumber);

  while (!predicate(status.state)) {
    if (signal?.aborted) {
      throw new Error("Flash cancelled");
    }

    if (Date.now() > deadline) {
      throw new Error(`DFU timeout: stuck in state ${stateName(status.state)}`);
    }

    if (status.state === DFU_STATE_ERROR) {
      log("Device in error state, clearing");
      await clearStatus(device, interfaceNumber);
      status = await getStatus(device, interfaceNumber);
      continue;
    }

    const waitMs = Math.max(status.pollTimeout, MIN_POLL_INTERVAL_MS);
    await delay(waitMs);
    status = await getStatus(device, interfaceNumber);
  }

  return status;
}

async function sendDfuseCommand(
  device: USBDevice,
  interfaceNumber: number,
  command: number,
  address: number,
  signal?: AbortSignal,
): Promise<void> {
  const cmdName = command === DFUSE_CMD_SET_ADDRESS ? "SET_ADDRESS" : "ERASE";
  log(`${cmdName} 0x${address.toString(16)}`);

  const data = new Uint8Array(5);
  data[0] = command;
  data[1] = address & 0xff;
  data[2] = (address >> 8) & 0xff;
  data[3] = (address >> 16) & 0xff;
  data[4] = (address >> 24) & 0xff;

  await controlTransferOut(device, interfaceNumber, DFU_DNLOAD, 0, data);

  // First getStatus triggers the operation (AN3156)
  const status = await getStatus(device, interfaceNumber);
  if (status.state !== DFU_STATE_DNBUSY) {
    log(`WARNING: expected dfuDNBUSY after ${cmdName}, got ${stateName(status.state)}`);
  }

  await delay(Math.max(status.pollTimeout, MIN_POLL_INTERVAL_MS));

  // Second getStatus confirms completion
  await pollUntil(device, interfaceNumber, (s) => s !== DFU_STATE_DNBUSY, signal);
}

async function eraseSector(
  device: USBDevice,
  interfaceNumber: number,
  address: number,
  signal?: AbortSignal,
): Promise<void> {
  await sendDfuseCommand(device, interfaceNumber, DFUSE_CMD_ERASE, address, signal);
}

async function setAddress(
  device: USBDevice,
  interfaceNumber: number,
  address: number,
  signal?: AbortSignal,
): Promise<void> {
  await sendDfuseCommand(device, interfaceNumber, DFUSE_CMD_SET_ADDRESS, address, signal);
}

function findDfuInterface(device: USBDevice): number {
  for (const config of device.configurations) {
    for (const iface of config.interfaces) {
      for (const alt of iface.alternates) {
        // DFU interface class = 0xFE, subclass = 0x01
        if (alt.interfaceClass === 0xfe && alt.interfaceSubclass === 0x01) {
          return iface.interfaceNumber;
        }
      }
    }
  }
  throw new Error("No DFU interface found on device");
}

async function closeDevice(device: USBDevice): Promise<void> {
  log("Closing device");
  await withTimeout(device.close(), USB_TRANSFER_TIMEOUT_MS, "Device close timed out").catch(() => {});
}

export async function flashDfu(
  device: USBDevice,
  firmware: Uint8Array,
  flashAddress: string,
  mcuFamily: string,
  options?: FlashOptions,
): Promise<FlashResult> {
  const startTime = Date.now();
  const address = Number.parseInt(flashAddress, 16);
  const totalBytes = firmware.length;

  log(`flashDfu: ${totalBytes} bytes at 0x${address.toString(16)}, MCU=${mcuFamily}`);

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
    reportProgress({ phase: "connecting", message: "Opening device..." });
    log("Opening device");
    await device.open();

    const interfaceNumber = findDfuInterface(device);
    log(`DFU interface: ${interfaceNumber}`);
    await device.selectConfiguration(1);
    await device.claimInterface(interfaceNumber);

    const transferSize = await getTransferSize(device);

    // Ensure device is in idle state
    log("Checking initial state");
    const status = await getStatus(device, interfaceNumber);
    if (status.state === DFU_STATE_ERROR) {
      log("Device in error state, clearing");
      await clearStatus(device, interfaceNumber);
    }
    if (status.state !== DFU_STATE_IDLE && status.state !== DFU_STATE_DNLOAD_IDLE) {
      log(`Device in ${stateName(status.state)}, aborting to IDLE`);
      await dfuAbort(device, interfaceNumber);
      await pollUntil(device, interfaceNumber, (s) => s === DFU_STATE_IDLE, options?.signal);
    }

    // Erase
    reportProgress({ phase: "erasing", message: "Erasing flash sectors..." });
    const sectors = getSectorsToErase(mcuFamily, address, firmware.length);
    log(`Erasing ${sectors.length} sectors`);

    if (sectors.length === 0) {
      throw new Error(`No flash sectors found for MCU family ${mcuFamily}`);
    }

    for (let i = 0; i < sectors.length; i++) {
      if (options?.signal?.aborted) {
        throw new Error("Flash cancelled");
      }

      reportProgress({
        phase: "erasing",
        percent: Math.round((i / sectors.length) * 100),
        message: `Erasing sector ${i + 1}/${sectors.length}...`,
      });

      await eraseSector(device, interfaceNumber, sectors[i].address, options?.signal);
    }
    log("Erase complete");

    // Write — SET_ADDRESS before every chunk, always block 2 (matches webdfu/dfu-util)
    reportProgress({ phase: "writing", percent: 0, message: "Writing firmware..." });
    const totalChunks = Math.ceil(firmware.length / transferSize);
    log(`Writing ${totalChunks} chunks (${transferSize} bytes each)`);

    let bytesWritten = 0;
    let chunkIndex = 0;

    while (bytesWritten < firmware.length) {
      if (options?.signal?.aborted) {
        throw new Error("Flash cancelled");
      }

      const chunkAddress = address + bytesWritten;
      const chunkSize = Math.min(transferSize, firmware.length - bytesWritten);
      const chunk = firmware.slice(bytesWritten, bytesWritten + chunkSize);

      log(`Chunk ${chunkIndex + 1}/${totalChunks}: ${chunkSize} bytes at 0x${chunkAddress.toString(16)}`);

      // 1. Set address pointer for this chunk
      await setAddress(device, interfaceNumber, chunkAddress, options?.signal);

      // 2. Send data (always block 2 per DfuSe)
      log(`  DNLOAD block=2, ${chunkSize} bytes`);
      await controlTransferOut(device, interfaceNumber, DFU_DNLOAD, 2, chunk);

      // 3. First getStatus triggers the write (AN3156)
      const writeStatus = await getStatus(device, interfaceNumber);
      if (writeStatus.state !== DFU_STATE_DNBUSY) {
        log(`  WARNING: expected dfuDNBUSY, got ${stateName(writeStatus.state)}`);
      }

      // 4. Wait pollTimeout then confirm completion
      await delay(Math.max(writeStatus.pollTimeout, MIN_POLL_INTERVAL_MS));
      await pollUntil(device, interfaceNumber, (s) => s !== DFU_STATE_DNBUSY, options?.signal);

      bytesWritten += chunkSize;
      chunkIndex++;

      reportProgress({
        phase: "writing",
        percent: Math.round((bytesWritten / firmware.length) * 100),
        bytesWritten,
        message: `Writing ${bytesWritten}/${firmware.length} bytes...`,
      });
    }
    log("Write complete");

    // Verify — SET_ADDRESS per chunk, always block 2
    reportProgress({ phase: "verifying", percent: 0, message: "Verifying firmware..." });
    log("Starting verify");

    let verifyOffset = 0;

    while (verifyOffset < firmware.length) {
      if (options?.signal?.aborted) {
        throw new Error("Flash cancelled");
      }

      const chunkAddress = address + verifyOffset;
      log(`Verify at 0x${chunkAddress.toString(16)}`);

      await dfuAbort(device, interfaceNumber);
      await pollUntil(device, interfaceNumber, (s) => s === DFU_STATE_IDLE, options?.signal);
      await setAddress(device, interfaceNumber, chunkAddress, options?.signal);
      await dfuAbort(device, interfaceNumber);
      await pollUntil(device, interfaceNumber, (s) => s === DFU_STATE_IDLE, options?.signal);

      const readSize = Math.min(transferSize, firmware.length - verifyOffset);

      const result = await controlTransferIn(device, interfaceNumber, DFU_UPLOAD, 2, readSize);

      if (!result.data) {
        throw new Error("Verification read failed: no data returned");
      }

      const readBack = new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength);
      const expected = firmware.slice(verifyOffset, verifyOffset + readBack.length);

      for (let i = 0; i < readBack.length; i++) {
        if (readBack[i] !== expected[i]) {
          throw new Error(
            `Verification failed at offset 0x${(verifyOffset + i).toString(16)}: ` +
              `expected 0x${expected[i].toString(16)}, got 0x${readBack[i].toString(16)}`,
          );
        }
      }

      verifyOffset += readBack.length;

      reportProgress({
        phase: "verifying",
        percent: Math.round((verifyOffset / firmware.length) * 100),
        bytesWritten: totalBytes,
        message: `Verifying ${verifyOffset}/${firmware.length} bytes...`,
      });
    }
    log("Verify complete");

    // Detach — reset device into application mode
    reportProgress({ phase: "complete", percent: 100, bytesWritten: totalBytes, message: "Flash complete!" });

    try {
      await dfuAbort(device, interfaceNumber);
      await pollUntil(device, interfaceNumber, (s) => s === DFU_STATE_IDLE, options?.signal);

      // Set address pointer so the bootloader knows where to jump (matches dfu-util/webdfu)
      log("Setting jump address before leave");
      await setAddress(device, interfaceNumber, address, options?.signal);

      // Leave DFU mode by issuing a zero-length download then reset
      log("Leaving DFU mode");
      await controlTransferOut(device, interfaceNumber, DFU_DNLOAD, 0, new Uint8Array(0));

      // Some devices will disconnect here, so ignore errors
      await getStatus(device, interfaceNumber).catch(() => {});
    } catch {
      // Device may have already reset
    }

    await closeDevice(device);
    log(`Flash completed in ${Date.now() - startTime}ms`);

    return {
      success: true,
      duration: Date.now() - startTime,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    log(`FLASH ERROR: ${error}`);

    await closeDevice(device);

    reportProgress({
      phase: "error",
      percent: 0,
      bytesWritten: 0,
      message: error,
    });

    return {
      success: false,
      error,
      duration: Date.now() - startTime,
    };
  }
}
