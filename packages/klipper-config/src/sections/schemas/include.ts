import { z } from "zod";
import type { SectionDefinition } from "../types";

const includeSchema = z.object({});

export const includeDefinition: SectionDefinition<typeof includeSchema> = {
  id: "include",
  naming: { kind: "named", prefix: "include" },
  schema: includeSchema,
  params: {},
  namePattern: /^[a-zA-Z0-9._/-]+$/,
  namePatternMessage: "Only letters, digits, dots, hyphens, underscores, and slashes",
  order: 1,
  category: "Includes",
  label: "Include",
};
