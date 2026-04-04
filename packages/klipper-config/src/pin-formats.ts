export interface McuPinFamily {
  id: string;
  label: string;
  pattern: RegExp;
}

export const MCU_PIN_FAMILIES: McuPinFamily[] = [
  { id: "stm32", label: "STM32", pattern: /^P[A-K]\d{1,2}$/ },
  { id: "rp2040", label: "RP2040", pattern: /^gpio\d{1,2}$/ },
  { id: "samd", label: "SAMD", pattern: /^P[AB]\d{2}$/ },
  { id: "lpc", label: "LPC", pattern: /^P\d\.\d{1,2}$/ },
  {
    id: "atmega",
    label: "ATmega",
    pattern: /^(P[A-L]\d|ar\d{1,2}|analog\d{1,2})$/,
  },
];

/**
 * Check if a pin name matches any known MCU pin format.
 */
export function matchesKnownPinFormat(pinName: string): boolean {
  return MCU_PIN_FAMILIES.some((f) => f.pattern.test(pinName));
}

const VIRTUAL_ENDSTOP_RE = /^[^:]+:(z_)?virtual_endstop$/;

/**
 * Detect virtual endstop pin patterns like "probe:z_virtual_endstop"
 * or "tmc2209_stepper_x:virtual_endstop".
 */
export function isVirtualEndstop(pin: string): boolean {
  return VIRTUAL_ENDSTOP_RE.test(pin);
}
