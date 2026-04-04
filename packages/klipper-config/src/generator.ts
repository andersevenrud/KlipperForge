import type { PrinterConfig } from "./types.js";

function formatValue(value: string | number | boolean): string {
  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }
  return String(value);
}

function formatSection(header: string, values: object): string {
  const lines: string[] = [`[${header}]`];
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      lines.push(`${key}: ${formatValue(value as string | number | boolean)}`);
    }
  }
  return lines.join("\n");
}

export function generateKlipperConfig(config: Partial<PrinterConfig>): string {
  const sections: string[] = [];

  if (config.printer) {
    sections.push(formatSection("printer", config.printer));
  }

  if (config.mcu) {
    sections.push(formatSection("mcu", config.mcu));
  }

  if (config.stepper_x) {
    sections.push(formatSection("stepper_x", config.stepper_x));
  }

  if (config.stepper_y) {
    sections.push(formatSection("stepper_y", config.stepper_y));
  }

  if (config.stepper_z) {
    sections.push(formatSection("stepper_z", config.stepper_z));
  }

  if (config.extruder) {
    sections.push(formatSection("extruder", config.extruder));
  }

  if (config.heater_bed) {
    sections.push(formatSection("heater_bed", config.heater_bed));
  }

  if (config.fan) {
    sections.push(formatSection("fan", config.fan));
  }

  if (config.heater_fan) {
    sections.push(formatSection("heater_fan hotend_fan", config.heater_fan));
  }

  if (config.probe) {
    sections.push(formatSection("probe", config.probe));
  }

  if (config.additionalSections) {
    for (const section of config.additionalSections) {
      const header = section.type === section.name ? section.name : `${section.type} ${section.name}`;
      sections.push(formatSection(header, section.values));
    }
  }

  if (config.macros) {
    for (const macro of config.macros) {
      sections.push(macro);
    }
  }

  return `${sections.join("\n\n")}\n`;
}
