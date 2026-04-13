const MANUFACTURER_ALIASES: Record<string, readonly string[]> = {
  btt: ["bigtreetech"],
};

export function tokenizeQueryWithAliases(query: string): string[][] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];
  return normalized.split(/\s+/).map((token) => {
    const extras = MANUFACTURER_ALIASES[token] ?? [];
    return extras.length > 0 ? [token, ...extras] : [token];
  });
}
