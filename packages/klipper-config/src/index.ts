// Import/export
export { cfgToDocument, parseMultiFileConfigs } from "./import";
export type { ParseResult } from "./parser";
export { COMMENT_SECTION_TYPE, parseKlipperConfig } from "./parser";
export type { McuPinFamily } from "./pin-formats";
// Pin format validation
export {
  isVirtualEndstop,
  MCU_PIN_FAMILIES,
  matchesKnownPinFormat,
} from "./pin-formats";
// Pin aliases
export type { BoardPinAlias } from "./pins";
export {
  buildReverseAliasMap,
  convertDocumentPins,
  extractBoardPinAliases,
  isReservedPin,
  parsePinAliasString,
  resolvePinAlias,
} from "./pins";
export type { KlipperForgeProject } from "./project";
export { exportProject, importProject } from "./project";
// Field grouping
export type { FieldGroup } from "./sections/field-groups";
export {
  applyControlVisibility,
  applyFieldGroups,
  applySensorTypeVisibility,
  getFieldGroup,
} from "./sections/field-groups";
// Sensor types
export { KNOWN_SENSOR_TYPES } from "./sections/generated/heating";
export { KNOWN_ACCEL_CHIPS } from "./sections/generated/tuning";
export type { NormalizeSectionOptions, NormalizeSectionResult } from "./sections/normalize";
// Section data normalization
export { computeHiddenFields, normalizeSectionData } from "./sections/normalize";
export {
  type ActiveOverride,
  collectActiveOverrides,
  type OverrideMap,
} from "./sections/overrides";
export type {
  ParamDefinition,
  ParamType,
  SectionParams,
} from "./sections/param-types";
export { resolveHeader, SectionRegistry } from "./sections/registry";
export { createSchemaFromParams } from "./sections/schema-from-params";
export {
  BOARD_PINS_NAMED_SECTION,
  BOARD_PINS_SECTION,
  beaconDefinition,
  beaconSchema,
  bedMeshDefinition,
  bedMeshSchema,
  bltouchDefinition,
  bltouchSchema,
  boardPinsDefinition,
  boardPinsNamedDefinition,
  boardPinsParams,
  boardPinsSchema,
  cartographerCoilDefinition,
  cartographerCoilSchema,
  cartographerDefinition,
  cartographerScanDefinition,
  cartographerScanSchema,
  cartographerSchema,
  cartographerTouchDefinition,
  cartographerTouchSchema,
  controllerFanDefinition,
  controllerFanSchema,
  createDefaultRegistry,
  defaultRegistry,
  extruderDefinition,
  extruderSchema,
  fanDefinition,
  fanGenericDefinition,
  fanGenericSchema,
  fanSchema,
  filamentMotionSensorDefinition,
  filamentSensorSchema,
  filamentSwitchSensorDefinition,
  heaterBedDefinition,
  heaterBedSchema,
  heaterFanDefinition,
  heaterFanSchema,
  inputShaperDefinition,
  inputShaperSchema,
  isBoardPinsSection,
  mcuDefinition,
  mcuNamedDefinition,
  mcuSchema,
  printerDefinition,
  printerSchema,
  probeDefinition,
  probeSchema,
  safeZHomeDefinition,
  safeZHomeSchema,
  stepperDefinition,
  stepperSchema,
  temperatureSensorDefinition,
  temperatureSensorSchema,
  tmc2209Definition,
  tmc5160Definition,
  tmcSchema,
} from "./sections/schemas";
// Section modes (TMC communication + MCU connection)
export {
  getSectionModeConfig,
  isTmcSection,
  SECTION_MODES,
  type SectionModeConfig,
  type SectionModeOption,
  SHARED_BUS_PIN_FIELDS,
} from "./sections/section-modes";
export type { ConfigSourceMap, DefaultMatch, MultiFileOutput } from "./sections/serializer";
export {
  SAVE_CONFIG_HEADER_PREFIX,
  type SerializeOptions,
  serializeConfig,
  serializeConfigWithSourceMap,
  serializeMultiFileConfig,
} from "./sections/serializer";
export type {
  ConfigDocument,
  ConfigValue,
  ImportWarning,
  McuBoardAssociation,
  SaveConfigSection,
  SectionDefinition,
  SectionInstance,
  SectionNaming,
  SectionOverride,
} from "./sections/types";
export {
  type BoardPinContext,
  type SectionValidationError,
  type ValidateDocumentOptions,
  validateDocument,
} from "./sections/validator";
export type { ConfigSection, KinematicsType } from "./types";
