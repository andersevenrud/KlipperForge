export interface SectionModeOption {
  value: string;
  label: string;
}

export interface SectionModeConfig {
  label: string;
  modes: SectionModeOption[];
  detect: (data: Record<string, unknown>) => string;
  getHiddenFields: (mode: string) => Set<string>;
}

// --- TMC internals ---

const SPI_FIELDS = new Set([
  "cs_pin",
  "spi_speed",
  "spi_bus",
  "spi_software_sclk_pin",
  "spi_software_mosi_pin",
  "spi_software_miso_pin",
  "chain_position",
  "chain_length",
]);

const UART_FIELDS = new Set(["uart_pin", "tx_pin", "select_pins", "uart_address"]);

export const SHARED_BUS_PIN_FIELDS = new Set([
  "spi_software_mosi_pin",
  "spi_software_miso_pin",
  "spi_software_sclk_pin",
  "i2c_software_scl_pin",
  "i2c_software_sda_pin",
  "uart_pin",
  "tx_pin",
]);

function detectTmc(availableModes: string[], data: Record<string, unknown>): string {
  if (availableModes.includes("uart") && data.uart_pin) {
    return "uart";
  }
  if (availableModes.includes("spi") && data.cs_pin && data.cs_pin !== "None") {
    return "spi";
  }
  return "standalone";
}

function getHiddenTmcFields(mode: string): Set<string> {
  const hidden = new Set<string>();
  if (mode !== "spi") {
    for (const f of SPI_FIELDS) hidden.add(f);
  }
  if (mode !== "uart") {
    for (const f of UART_FIELDS) hidden.add(f);
  }
  return hidden;
}

function tmcConfig(modeValues: string[]): SectionModeConfig {
  const modes = modeValues.map((m) => ({ value: m, label: m.toUpperCase() }));
  return {
    label: "Communication Mode",
    modes,
    detect: (data) => detectTmc(modeValues, data),
    getHiddenFields: getHiddenTmcFields,
  };
}

// --- MCU internals ---

const SERIAL_ONLY_FIELDS = new Set(["serial"]);
const CANBUS_ONLY_FIELDS = new Set(["canbus_uuid", "canbus_interface"]);

function detectMcu(data: Record<string, unknown>): string {
  if (data.canbus_uuid) return "canbus";
  return "serial";
}

function getHiddenMcuFields(mode: string): Set<string> {
  const hidden = new Set<string>();
  if (mode !== "serial") {
    for (const f of SERIAL_ONLY_FIELDS) hidden.add(f);
  }
  if (mode !== "canbus") {
    for (const f of CANBUS_ONLY_FIELDS) hidden.add(f);
  }
  return hidden;
}

const MCU_CONFIG: SectionModeConfig = {
  label: "Connection Type",
  modes: [
    { value: "serial", label: "Serial" },
    { value: "canbus", label: "CAN Bus" },
  ],
  detect: detectMcu,
  getHiddenFields: getHiddenMcuFields,
};

// --- Registry ---

export const SECTION_MODES: Record<string, SectionModeConfig> = {
  tmc2130: tmcConfig(["spi", "standalone"]),
  tmc2208: tmcConfig(["uart", "standalone"]),
  tmc2209: tmcConfig(["uart", "standalone"]),
  tmc2240: tmcConfig(["spi", "uart", "standalone"]),
  tmc2660: tmcConfig(["spi", "standalone"]),
  tmc5160: tmcConfig(["spi", "standalone"]),
  mcu: MCU_CONFIG,
  mcu_named: MCU_CONFIG,
};

export function getSectionModeConfig(definitionId: string): SectionModeConfig | undefined {
  return SECTION_MODES[definitionId];
}

export function isTmcSection(definitionId: string): boolean {
  return definitionId in SECTION_MODES && definitionId.startsWith("tmc");
}
