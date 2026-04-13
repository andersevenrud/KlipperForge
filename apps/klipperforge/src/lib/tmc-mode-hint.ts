const STEALTHCHOP_ALWAYS_THRESHOLD = 999_999;

function coerceThresholdNumber(value: unknown): number {
  if (value === undefined || value === null || value === "") return 0;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function getTmcModeHint(header: string, field: string, value: unknown): string | undefined {
  if (!header.startsWith("tmc")) return undefined;
  if (field !== "stealthchop_threshold" && field !== "coolstep_threshold") return undefined;
  const threshold = coerceThresholdNumber(value);
  if (field === "stealthchop_threshold") {
    if (threshold <= 0) return "SpreadCycle mode (stealthChop disabled)";
    if (threshold >= STEALTHCHOP_ALWAYS_THRESHOLD) return "StealthChop mode (always)";
    return `StealthChop below ${threshold} mm/s, SpreadCycle above`;
  }
  if (threshold <= 0) return "CoolStep disabled";
  return `CoolStep enabled at ≥ ${threshold} mm/s`;
}
