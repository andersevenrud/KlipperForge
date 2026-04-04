export interface FlashSector {
  start: number;
  size: number;
  count: number;
}

export const FLASH_SECTORS: Record<string, FlashSector[]> = {
  STM32F072: [{ start: 0x08000000, size: 2048, count: 64 }],
  STM32F103: [{ start: 0x08000000, size: 1024, count: 128 }],
  STM32F401: [
    { start: 0x08000000, size: 16384, count: 4 },
    { start: 0x08010000, size: 65536, count: 1 },
    { start: 0x08020000, size: 131072, count: 1 },
  ],
  STM32F405: [
    { start: 0x08000000, size: 16384, count: 4 },
    { start: 0x08010000, size: 65536, count: 1 },
    { start: 0x08020000, size: 131072, count: 7 },
  ],
  STM32F407: [
    { start: 0x08000000, size: 16384, count: 4 },
    { start: 0x08010000, size: 65536, count: 1 },
    { start: 0x08020000, size: 131072, count: 7 },
  ],
  STM32F446: [
    { start: 0x08000000, size: 16384, count: 4 },
    { start: 0x08010000, size: 65536, count: 1 },
    { start: 0x08020000, size: 131072, count: 3 },
  ],
  STM32G0B1: [{ start: 0x08000000, size: 2048, count: 256 }],
  STM32H723: [{ start: 0x08000000, size: 131072, count: 8 }],
  STM32H743: [{ start: 0x08000000, size: 131072, count: 16 }],
};

interface EraseSector {
  address: number;
  size: number;
}

export function getSectorsToErase(mcuFamily: string, startAddress: number, dataLength: number): EraseSector[] {
  const sectors = FLASH_SECTORS[mcuFamily];
  if (!sectors) {
    return [];
  }

  const endAddress = startAddress + dataLength;
  const result: EraseSector[] = [];

  for (const group of sectors) {
    for (let i = 0; i < group.count; i++) {
      const sectorStart = group.start + i * group.size;
      const sectorEnd = sectorStart + group.size;

      if (sectorStart < endAddress && sectorEnd > startAddress) {
        result.push({ address: sectorStart, size: group.size });
      }
    }
  }

  return result;
}
