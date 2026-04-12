const MANUFACTURER_ALIASES: Record<string, readonly string[]> = {
  btt: ["bigtreetech"],
};

export function expandQueryWithAliases(query: string): string[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];
  const extras = MANUFACTURER_ALIASES[normalized] ?? [];
  return extras.length > 0 ? [normalized, ...extras] : [normalized];
}
