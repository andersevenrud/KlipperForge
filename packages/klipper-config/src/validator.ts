import type { PrinterConfig } from "./types.js";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateConfig(config: Partial<PrinterConfig>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!config.printer) {
    errors.push({ field: "printer", message: "Printer section is required" });
  } else if (!config.printer.kinematics || config.printer.kinematics === "none") {
    errors.push({ field: "printer.kinematics", message: "Kinematics type must be set" });
  }

  if (!config.mcu) {
    errors.push({ field: "mcu", message: "MCU section is required" });
  }

  if (!config.stepper_x) {
    errors.push({ field: "stepper_x", message: "Stepper X is required" });
  }

  if (!config.stepper_y) {
    errors.push({ field: "stepper_y", message: "Stepper Y is required" });
  }

  if (!config.stepper_z) {
    errors.push({ field: "stepper_z", message: "Stepper Z is required" });
  }

  if (!config.extruder) {
    errors.push({ field: "extruder", message: "Extruder section is required" });
  }

  return errors;
}
