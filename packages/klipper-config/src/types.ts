import type { IniSection } from "@klipperforge/configparser";

export type KinematicsType =
  | "cartesian"
  | "corexy"
  | "corexz"
  | "delta"
  | "hybrid_corexy"
  | "hybrid_corexz"
  | "polar"
  | "rotary_delta"
  | "winch"
  | "none";

export interface ConfigSection extends IniSection {
  annotation?: string;
  rawText?: string;
}
