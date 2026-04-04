const DFUSE_SIGNATURE = "DfuSe";
const DFUSE_VERSION = 1;
const TARGET_PREFIX = "Target";
const TARGET_ALT_SETTING = 0;
const TARGET_NAMED = 1;
const TARGET_NAME = "ST...";
const SUFFIX_LENGTH = 16;

export function binToDfuse(data: Uint8Array, address: number): Uint8Array {
  const elementHeaderSize = 8;
  const elementSize = elementHeaderSize + data.length;

  const targetPrefixSize = 274;
  const dfuPrefixSize = 11;

  const totalSize = dfuPrefixSize + targetPrefixSize + elementSize + SUFFIX_LENGTH;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let offset = 0;

  // DFU prefix (11 bytes)
  const encoder = new TextEncoder();
  bytes.set(encoder.encode(DFUSE_SIGNATURE), offset);
  offset += 5;
  view.setUint8(offset, DFUSE_VERSION);
  offset += 1;
  view.setUint32(offset, totalSize - SUFFIX_LENGTH, true);
  offset += 4;
  view.setUint8(offset, 1); // number of targets
  offset += 1;

  // Target prefix (274 bytes)
  const targetStart = offset;
  bytes.set(encoder.encode(TARGET_PREFIX), offset);
  offset += 6;
  view.setUint8(offset, TARGET_ALT_SETTING);
  offset += 1;
  view.setUint32(offset, TARGET_NAMED, true);
  offset += 4;
  const nameBytes = encoder.encode(TARGET_NAME);
  bytes.set(nameBytes, offset);
  offset = targetStart + 6 + 1 + 4 + 255; // skip to after name field
  view.setUint32(offset, elementSize, true);
  offset += 4;
  view.setUint32(offset, 1, true); // number of elements
  offset += 4;

  // Image element header (8 bytes) + data
  view.setUint32(offset, address, true);
  offset += 4;
  view.setUint32(offset, data.length, true);
  offset += 4;
  bytes.set(data, offset);
  offset += data.length;

  // DFU suffix (16 bytes)
  view.setUint16(offset, 0xffff, true); // bcdDevice
  offset += 2;
  view.setUint16(offset, 0x0483, true); // idProduct (STMicroelectronics)
  offset += 2;
  view.setUint16(offset, 0xdf11, true); // idVendor (DfuSe)
  offset += 2;
  view.setUint16(offset, 0x011a, true); // bcdDFU (DFU spec 1.1a)
  offset += 2;
  bytes.set(encoder.encode("UFD"), offset); // ucDfuSignature "UFD"
  offset += 3;
  view.setUint8(offset, SUFFIX_LENGTH);
  offset += 1;

  // CRC32 over entire file except the CRC field itself
  const crc = computeCrc32(bytes.subarray(0, offset));
  view.setUint32(offset, crc, true);

  return bytes;
}

function computeCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return crc ^ 0xffffffff;
}
