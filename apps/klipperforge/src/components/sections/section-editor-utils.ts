import { ZodBoolean, ZodNumber, ZodOptional, type ZodTypeAny } from "zod";

export function unwrapType(schema: ZodTypeAny): { inner: ZodTypeAny; optional: boolean } {
  if (schema instanceof ZodOptional) {
    return { inner: schema.unwrap(), optional: true };
  }
  return { inner: schema, optional: false };
}

export function getFieldType(inner: ZodTypeAny): "string" | "number" | "boolean" {
  if (inner instanceof ZodNumber) return "number";
  if (inner instanceof ZodBoolean) return "boolean";
  return "string";
}

export function numericSetValueAs(v: string | number): number | string | undefined {
  if (v === "" || v === undefined) return undefined;
  if (typeof v === "number") return v;
  const n = Number(v.replace(",", "."));
  return Number.isNaN(n) ? v : n;
}

export function isPinField(name: string): boolean {
  return name === "pin" || name.endsWith("_pin");
}

export function formatPlaceholder(value: string | number | boolean | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") {
    // Avoid scientific notation (e.g. 1e-7 → "0.0000001")
    const str = String(value);
    if (!str.includes("e")) return str;
    const decimals = Math.max(0, -Math.floor(Math.log10(Math.abs(value)))) + 1;
    return value.toFixed(decimals);
  }
  return String(value);
}
