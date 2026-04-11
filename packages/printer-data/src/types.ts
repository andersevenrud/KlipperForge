import type { ConfigValue, KinematicsType, McuBoardAssociation, SectionInstance } from "@klipperforge/klipper-config";

// ---------------------------------------------------------------------------
// Base types
// ---------------------------------------------------------------------------

interface BaseReference<T extends string> {
  label: string;
  url: string;
  type: T;
}

export interface BedSize {
  x: number;
  y: number;
  z: number;
}

export interface PresetDefaults {
  sections: SectionInstance[];
  mcuBoards?: McuBoardAssociation[];
}

export interface PinUsage {
  section: string;
  field: string;
}

// ---------------------------------------------------------------------------
// Reference types
// ---------------------------------------------------------------------------

export type PrinterReferenceType = "product" | "github" | "wiki" | "documentation" | "other";
export interface PrinterReference extends BaseReference<PrinterReferenceType> {}

export type McuBoardReferenceType = "github" | "wiki" | "manual" | "pinout" | "schematic" | "dimensions" | "other";
export interface McuBoardReference extends BaseReference<McuBoardReferenceType> {}

export type ProbeReferenceType = "datasheet" | "product" | "github" | "documentation" | "other";
export interface ProbeReference extends BaseReference<ProbeReferenceType> {}

export type StepperMotorReferenceType = "datasheet" | "product" | "github" | "other";
export interface StepperMotorReference extends BaseReference<StepperMotorReferenceType> {}

export type FanReferenceType = "datasheet" | "product" | "github" | "documentation" | "other";
export interface FanReference extends BaseReference<FanReferenceType> {}

export type ThermistorReferenceType = "datasheet" | "product" | "github" | "documentation" | "other";
export interface ThermistorReference extends BaseReference<ThermistorReferenceType> {}

export type ExtruderReferenceType = "datasheet" | "product" | "github" | "documentation" | "other";
export interface ExtruderReference extends BaseReference<ExtruderReferenceType> {}

export type HotendReferenceType = "datasheet" | "product" | "github" | "documentation" | "other";
export interface HotendReference extends BaseReference<HotendReferenceType> {}

export type PowerSupplyReferenceType = "datasheet" | "product" | "github" | "documentation" | "other";
export interface PowerSupplyReference extends BaseReference<PowerSupplyReferenceType> {}

export type AccessoryReferenceType = "datasheet" | "product" | "github" | "documentation" | "other";
export interface AccessoryReference extends BaseReference<AccessoryReferenceType> {}

export type FilamentReferenceType = "datasheet" | "product" | "github" | "documentation" | "other";
export interface FilamentReference extends BaseReference<FilamentReferenceType> {}

export type DisplayReferenceType = "datasheet" | "product" | "github" | "documentation" | "other";
export interface DisplayReference extends BaseReference<DisplayReferenceType> {}

export type ToolheadReferenceType = "datasheet" | "product" | "github" | "documentation" | "other";
export interface ToolheadReference extends BaseReference<ToolheadReferenceType> {}

export type MmuReferenceType = "datasheet" | "product" | "github" | "documentation" | "other";
export interface MmuReference extends BaseReference<MmuReferenceType> {}

export type StepperDriverReferenceType = "datasheet" | "product" | "github" | "documentation" | "other";
export interface StepperDriverReference extends BaseReference<StepperDriverReferenceType> {}

export type AnyReferenceType =
  | PrinterReferenceType
  | McuBoardReferenceType
  | ProbeReferenceType
  | StepperMotorReferenceType
  | FanReferenceType
  | ThermistorReferenceType
  | ExtruderReferenceType
  | HotendReferenceType
  | PowerSupplyReferenceType
  | AccessoryReferenceType
  | FilamentReferenceType
  | DisplayReferenceType
  | ToolheadReferenceType
  | MmuReferenceType
  | StepperDriverReferenceType;

// ---------------------------------------------------------------------------
// Index entry types
// ---------------------------------------------------------------------------

export interface PrinterIndexEntry {
  id: string;
  name: string;
  manufacturer: string;
  hasImage?: boolean;
  variants?: PrinterVariantEntry[];
}

export interface PrinterVariantEntry {
  id: string;
  name: string;
}

export interface McuBoardIndexEntry {
  id: string;
  name: string;
  vendor: string;
  hasImage?: boolean;
}

export interface ProbeIndexEntry {
  id: string;
  name: string;
  manufacturer: string;
  probeType: string;
  hasImage?: boolean;
}

export interface StepperMotorIndexEntry {
  id: string;
  name: string;
  manufacturer: string;
  nemaSize: number;
  hasImage?: boolean;
}

export interface FanIndexEntry {
  id: string;
  name: string;
  manufacturer: string;
  fanType: string;
  size: string;
  hasImage?: boolean;
  pcbLayoutId?: string;
}

export interface ThermistorIndexEntry {
  id: string;
  name: string;
  manufacturer: string;
  sensorType: string;
  hasImage?: boolean;
}

export interface ExtruderIndexEntry {
  id: string;
  name: string;
  manufacturer: string;
  driveType: string;
  hasImage?: boolean;
}

export interface HotendIndexEntry {
  id: string;
  name: string;
  manufacturer: string;
  hotendType: string;
  hasImage?: boolean;
}

export interface PowerSupplyIndexEntry {
  id: string;
  name: string;
  manufacturer: string;
  voltage: number;
  wattage: number;
  formFactor: string;
  hasImage?: boolean;
}

export interface AccessoryIndexEntry {
  id: string;
  name: string;
  manufacturer: string;
  accessoryType: string;
  hasImage?: boolean;
}

export interface FilamentIndexEntry {
  id: string;
  name: string;
  manufacturer: string;
  filamentType: string;
  hasImage?: boolean;
}

export interface DisplayIndexEntry {
  id: string;
  name: string;
  manufacturer: string;
  displayType: string;
  hasImage?: boolean;
}

export interface ToolheadIndexEntry {
  id: string;
  name: string;
  manufacturer: string;
  toolheadType: string;
  hasImage?: boolean;
}

export interface MmuIndexEntry {
  id: string;
  name: string;
  manufacturer: string;
  mmuType: string;
  hasImage?: boolean;
}

export interface PcbLayoutIndexEntry {
  boardId: string;
  name: string;
  hasImage?: boolean;
}

export interface StepperDriverIndexEntry {
  id: string;
  name: string;
  manufacturer: string;
  driverInterface: "SPI" | "UART" | "Step/Dir";
  klipperSection: string;
  hasImage?: boolean;
}

// ---------------------------------------------------------------------------
// Equipment / category types
// ---------------------------------------------------------------------------

export type EquipmentCategory = "fans" | "probes" | "sensors" | "stepper-drivers";

export interface EquipmentSectionData {
  definitionId: string;
  instanceName?: string;
  data: Record<string, ConfigValue>;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: EquipmentCategory;
  description: string;
  sections: EquipmentSectionData[];
}

export interface MacroTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  gcode: string;
}

// ---------------------------------------------------------------------------
// Printer equipment types
// ---------------------------------------------------------------------------

export type PrinterEquipmentCategory =
  | "accessories"
  | "displays"
  | "extruders"
  | "fans"
  | "filaments"
  | "hotends"
  | "mcu-boards"
  | "mmus"
  | "power-supplies"
  | "probes"
  | "stepper-drivers"
  | "stepper-motors"
  | "thermistors"
  | "toolheads";

export interface PrinterEquipmentEntry {
  category: PrinterEquipmentCategory;
  id?: string;
  label: string;
  role?: string;
}

export type CrossReferenceCategory = PrinterEquipmentCategory | "printers";

export interface RelatedArticle {
  category: CrossReferenceCategory;
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Printer types
// ---------------------------------------------------------------------------

export interface PrinterVariant {
  id: string;
  name: string;
  kinematics: KinematicsType;
  bedSize: BedSize;
  defaults: PresetDefaults;
}

export interface PrinterPreset {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  kinematics?: KinematicsType;
  bedSize?: BedSize;
  defaults?: PresetDefaults;
  variants?: PrinterVariant[];
  equipment?: PrinterEquipmentEntry[];
  references?: PrinterReference[];
  unverified?: string[];
  relatedArticles?: RelatedArticle[];
}

export interface ResolvedPreset {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  kinematics: KinematicsType;
  bedSize: BedSize;
  defaults: PresetDefaults;
}

// ---------------------------------------------------------------------------
// MCU Board types
// ---------------------------------------------------------------------------

export interface McuBoardDrivers {
  count: number;
  model?: string;
  modelId?: string;
  connector?: "stepstick" | "ez";
}

export interface McuBoardDimensions {
  width: number;
  height: number;
}

export interface McuBoard {
  id: string;
  name: string;
  mcu: string;
  pins: string[];
  aliases?: Record<string, string>;
  references?: McuBoardReference[];
  drivers?: McuBoardDrivers;
  dimensions?: McuBoardDimensions;
  maxMotorVoltage?: number;
  mcuVariants?: string[];
  relatedArticles?: RelatedArticle[];
}

// ---------------------------------------------------------------------------
// PCB Layout types
// ---------------------------------------------------------------------------

export type PcbConnectorCategory =
  | "stepper"
  | "fan"
  | "heater"
  | "thermistor"
  | "endstop"
  | "display"
  | "probe"
  | "power"
  | "communication"
  | "driver"
  | "jumper"
  | "button"
  | "dip-switch"
  | "misc";

export interface PcbConnector {
  name: string;
  title?: string;
  category: PcbConnectorCategory;
  x: number;
  y: number;
  width: number;
  height: number;
  pins: string[];
  pinHints?: string[];
  orientation: "horizontal" | "vertical";
  rotation?: number;
  rows: number;
}

export interface PcbViewBox {
  width: number;
  height: number;
}

export interface PcbImageOffset {
  x?: number;
  y?: number;
}

export interface JumperOption {
  label: string;
  pattern: number[][];
}

export interface PcbLayout {
  boardId: string;
  name: string;
  viewBox: PcbViewBox;
  image?: string;
  imageOffset?: PcbImageOffset;
  connectors: PcbConnector[];
  jumperConfigs?: Record<string, JumperOption[]>;
}

// ---------------------------------------------------------------------------
// Probe types
// ---------------------------------------------------------------------------

export interface ProbeElectricalSpecs {
  operatingVoltage: string;
  signalType: string;
  currentDraw?: string;
}

export interface ProbePerformanceSpecs {
  repeatability: string;
  triggerDistance?: string;
  bedCompatibility?: string[];
  bedCompatibilityNote?: string;
  temperatureCompensation?: boolean;
  multiPoint?: boolean;
}

export interface ProbePhysicalSpecs {
  dimensions?: string;
  weight?: number;
  mountType?: string;
}

export interface Probe {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  probeType: string;
  electricalSpecs: ProbeElectricalSpecs;
  performanceSpecs: ProbePerformanceSpecs;
  physicalSpecs?: ProbePhysicalSpecs;
  klipperSection?: string;
  references?: ProbeReference[];
  unverified?: string[];
  relatedArticles?: RelatedArticle[];
}

// ---------------------------------------------------------------------------
// Stepper Motor types
// ---------------------------------------------------------------------------

export interface StepperMotorElectricalSpecs {
  ratedCurrent: number;
  holdingTorque: number;
  stepAngle: number;
  phaseResistance?: number;
  phaseInductance?: number;
  ratedVoltage?: number;
}

export interface StepperMotorPhysicalSpecs {
  bodyLength: number;
  weight?: number;
  shaftDiameter: number;
  shaftLength?: number;
}

export interface StepperMotor {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  nemaSize: number;
  electricalSpecs: StepperMotorElectricalSpecs;
  physicalSpecs: StepperMotorPhysicalSpecs;
  connectorType?: string;
  temperatureRating?: number;
  references?: StepperMotorReference[];
  relatedArticles?: RelatedArticle[];
}

// ---------------------------------------------------------------------------
// Fan types
// ---------------------------------------------------------------------------

export interface FanAirflowSpecs {
  airflow?: number;
  staticPressure?: number;
  rpm?: number;
  rpmRange?: string;
}

export interface FanElectricalSpecs {
  voltage: number;
  current?: number;
  power?: number;
  pwmCapable?: boolean;
  tachoSignal?: boolean;
}

export interface FanNoiseSpecs {
  noiseLevel?: number;
}

export interface FanPhysicalSpecs {
  dimensions: string;
  weight?: number;
  bearingType?: string;
  connectorType?: string;
  leadWireLength?: number;
}

export interface Fan {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  fanType: string;
  size: string;
  pcbLayoutId?: string;
  airflowSpecs: FanAirflowSpecs;
  electricalSpecs: FanElectricalSpecs;
  noiseSpecs?: FanNoiseSpecs;
  physicalSpecs: FanPhysicalSpecs;
  references?: FanReference[];
  unverified?: string[];
  relatedArticles?: RelatedArticle[];
}

// ---------------------------------------------------------------------------
// Thermistor types
// ---------------------------------------------------------------------------

export interface ThermistorSensingSpecs {
  resistanceAt25C?: number;
  betaValue?: number;
  temperatureRange: string;
  accuracy?: string;
  responseTime?: string;
}

export interface ThermistorKlipperSpecs {
  sensorType: string;
  requiresAmplifier?: boolean;
  amplifierChip?: string;
  pullupResistor?: number;
}

export interface ThermistorPhysicalSpecs {
  packageType?: string;
  dimensions?: string;
  leadType?: string;
}

export interface Thermistor {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  sensorType: string;
  sensingSpecs: ThermistorSensingSpecs;
  klipperSpecs: ThermistorKlipperSpecs;
  physicalSpecs?: ThermistorPhysicalSpecs;
  references?: ThermistorReference[];
  unverified?: string[];
  relatedArticles?: RelatedArticle[];
}

// ---------------------------------------------------------------------------
// Extruder types
// ---------------------------------------------------------------------------

export interface ExtruderMechanicalSpecs {
  gearRatio: string;
  filamentDiameter: number;
  gripType: string;
  maxFeedRate?: number;
}

export interface ExtruderMotorSpecs {
  includedMotor?: boolean;
  motorType?: string;
  compatibleMotors?: string;
}

export interface ExtruderPhysicalSpecs {
  weight?: number;
  dimensions?: string;
  mountPattern?: string;
}

export interface Extruder {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  driveType: string;
  mechanicalSpecs: ExtruderMechanicalSpecs;
  motorSpecs: ExtruderMotorSpecs;
  physicalSpecs?: ExtruderPhysicalSpecs;
  features?: string[];
  references?: ExtruderReference[];
  unverified?: string[];
  relatedArticles?: RelatedArticle[];
}

// ---------------------------------------------------------------------------
// Hotend types
// ---------------------------------------------------------------------------

export interface HotendThermalSpecs {
  maxTemperature: number;
  heaterType: string;
  heaterPower?: number;
  heatUpTime?: string;
  thermistorType?: string;
  thermistorId?: string;
}

export interface HotendHeatBreakSpecs {
  type: string;
  material?: string;
  retraction?: string;
}

export interface HotendNozzleSpecs {
  system: string;
  includedNozzleSizeMm?: number;
  compatibleNozzles?: string[];
  maxFlowRate?: string;
}

export interface HotendPhysicalSpecs {
  filamentDiameter: number;
  weight?: number;
  dimensions?: string;
  mountType?: string;
}

export interface Hotend {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  hotendType: string;
  thermalSpecs: HotendThermalSpecs;
  heatBreakSpecs: HotendHeatBreakSpecs;
  nozzleSpecs: HotendNozzleSpecs;
  physicalSpecs?: HotendPhysicalSpecs;
  features?: string[];
  references?: HotendReference[];
  unverified?: string[];
  relatedArticles?: RelatedArticle[];
}

// ---------------------------------------------------------------------------
// Power Supply types
// ---------------------------------------------------------------------------

export interface PowerSupplyElectricalSpecs {
  outputVoltage: number;
  outputCurrent: number;
  outputPower: number;
  inputVoltageRange: string;
  efficiency: number;
  powerFactorCorrection: boolean;
}

export interface PowerSupplyPhysicalSpecs {
  dimensions: string;
  weight?: number;
  coolingMethod: string;
  hasFan: boolean;
}

export interface PowerSupply {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  voltage: number;
  wattage: number;
  formFactor: string;
  electricalSpecs: PowerSupplyElectricalSpecs;
  physicalSpecs: PowerSupplyPhysicalSpecs;
  certifications: string[];
  protections: string[];
  operatingTemperature: string;
  typicalUseCases: string[];
  communityRecommendation: "highly-recommended" | "recommended" | "standard" | "budget";
  references?: PowerSupplyReference[];
  unverified?: string[];
  relatedArticles?: RelatedArticle[];
}

// ---------------------------------------------------------------------------
// Filament types
// ---------------------------------------------------------------------------

export interface FilamentPrintSpecs {
  nozzleTempRange: string;
  bedTempRange: string;
  printSpeedRange?: string;
  coolingFan?: string;
  enclosureRequired?: boolean;
  firstLayerTemp?: string;
}

export interface FilamentMechanicalSpecs {
  tensileStrength?: number;
  heatDeflectionTemp?: number;
  elongationAtBreak?: number;
  shoreHardness?: string;
  impactStrength?: string;
}

export interface FilamentEnvironmentalSpecs {
  moistureSensitivity?: string;
  uvResistance?: string;
  foodSafe?: boolean;
  dryingTemp?: number;
  dryingTime?: number;
}

export interface FilamentPhysicalSpecs {
  diameter: number;
  density?: number;
  glassTransitionTemp?: number;
  meltingPoint?: number;
}

export interface FilamentRatings {
  strength: number;
  stiffness: number;
  durability: number;
  printability: number;
  heatResistance: number;
}

export interface Filament {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  filamentType: string;
  ratings: FilamentRatings;
  printSpecs: FilamentPrintSpecs;
  mechanicalSpecs?: FilamentMechanicalSpecs;
  environmentalSpecs?: FilamentEnvironmentalSpecs;
  physicalSpecs: FilamentPhysicalSpecs;
  features?: string[];
  references?: FilamentReference[];
  unverified?: string[];
  relatedArticles?: RelatedArticle[];
}

// ---------------------------------------------------------------------------
// Index types
// ---------------------------------------------------------------------------

export interface PrinterIndex {
  printers: PrinterIndexEntry[];
}

export interface McuBoardIndex {
  boards: McuBoardIndexEntry[];
}

export interface ProbeIndex {
  probes: ProbeIndexEntry[];
}

export interface StepperMotorIndex {
  motors: StepperMotorIndexEntry[];
}

export interface FanIndex {
  fans: FanIndexEntry[];
}

export interface ThermistorIndex {
  thermistors: ThermistorIndexEntry[];
}

export interface ExtruderIndex {
  extruders: ExtruderIndexEntry[];
}

export interface HotendIndex {
  hotends: HotendIndexEntry[];
}

export interface PowerSupplyIndex {
  powerSupplies: PowerSupplyIndexEntry[];
}

export interface AccessoryElectricalSpecs {
  voltage?: string;
  signalType?: string;
}

export interface AccessoryPhysicalSpecs {
  dimensions?: string;
  weight?: number;
  filamentDiameter?: number;
}

export interface Accessory {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  accessoryType: string;
  electricalSpecs?: AccessoryElectricalSpecs;
  physicalSpecs?: AccessoryPhysicalSpecs;
  firmware?: string[];
  features?: string[];
  references?: AccessoryReference[];
  unverified?: string[];
  relatedArticles?: RelatedArticle[];
}

export interface AccessoryIndex {
  accessories: AccessoryIndexEntry[];
}

export interface FilamentIndex {
  filaments: FilamentIndexEntry[];
}

export interface DisplayScreenSpecs {
  size: string;
  resolution: string;
  panelType: string;
  touchscreen: boolean;
  driver?: string;
}

export interface DisplayConnectionSpecs {
  interface: string;
  connector?: string;
}

export interface DisplayKlipperIntegration {
  method: string;
  klipperDisplayType?: string;
  requiresSbc?: boolean;
  softwareRequired?: string;
}

export interface DisplayComputeSpecs {
  processor?: string;
  ram?: string;
  wifi?: boolean;
  battery?: boolean;
}

export interface DisplayPhysicalSpecs {
  dimensions?: string;
  weight?: number;
  mountType?: string;
}

export interface Display {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  displayType: string;
  screenSpecs: DisplayScreenSpecs;
  connectionSpecs: DisplayConnectionSpecs;
  klipperIntegration: DisplayKlipperIntegration;
  computeSpecs?: DisplayComputeSpecs;
  physicalSpecs?: DisplayPhysicalSpecs;
  features?: string[];
  references?: DisplayReference[];
  unverified?: string[];
  relatedArticles?: RelatedArticle[];
}

export interface DisplayIndex {
  displays: DisplayIndexEntry[];
}

// ---------------------------------------------------------------------------
// Toolhead types
// ---------------------------------------------------------------------------

export interface ToolheadCompatibilitySpecs {
  targetPrinters: string[];
  railSystems?: string[];
  hotendMounts?: string[];
  extruderMounts?: string[];
  probeMounts?: string[];
  fanMounts?: string[];
}

export interface ToolheadPhysicalSpecs {
  weight?: number;
  dimensions?: string;
  material?: string;
  printable?: boolean;
}

export interface Toolhead {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  toolheadType: string;
  compatibilitySpecs: ToolheadCompatibilitySpecs;
  physicalSpecs?: ToolheadPhysicalSpecs;
  features?: string[];
  references?: ToolheadReference[];
  unverified?: string[];
  relatedArticles?: RelatedArticle[];
}

export interface ToolheadIndex {
  toolheads: ToolheadIndexEntry[];
}

// ---------------------------------------------------------------------------
// MMU types
// ---------------------------------------------------------------------------

export interface MmuFilamentSpecs {
  filamentCapacity: number;
  scalable: boolean;
  maxFilaments?: number;
  filamentDiameter: number;
}

export interface MmuMechanicalSpecs {
  driveType: string;
  motorCount?: number;
  bufferRequired?: boolean;
  bufferType?: string;
}

export interface MmuSoftwareSpecs {
  klipperDriver: string;
  klipperDriverUrl?: string;
}

export interface MmuPhysicalSpecs {
  dimensions?: string;
  weight?: number;
  material?: string;
  printable?: boolean;
}

export interface Mmu {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  mmuType: string;
  openSource: boolean;
  license?: string;
  filamentSpecs: MmuFilamentSpecs;
  mechanicalSpecs: MmuMechanicalSpecs;
  softwareSpecs: MmuSoftwareSpecs;
  physicalSpecs?: MmuPhysicalSpecs;
  features?: string[];
  references?: MmuReference[];
  unverified?: string[];
  relatedArticles?: RelatedArticle[];
}

export interface MmuIndex {
  mmus: MmuIndexEntry[];
}

// ---------------------------------------------------------------------------
// Stepper Driver types
// ---------------------------------------------------------------------------

export interface StepperDriverElectricalSpecs {
  supplyVoltageMin?: number;
  supplyVoltageMax?: number;
  rmsCurrentMax?: number;
  peakCurrentMax?: number;
  logicVoltageMin?: number;
  logicVoltageMax?: number;
}

export interface StepperDriverFeatureSpecs {
  microstepsMax: number;
  interpolationTo256?: boolean;
  stealthChop?: "none" | "stealthChop" | "stealthChop2";
  spreadCycle?: boolean;
  coolStep?: boolean;
  stallGuard?: "none" | "stallGuard" | "stallGuard2" | "stallGuard4";
  dcStep?: boolean;
  sensorlessHoming?: boolean;
}

export interface StepperDriverKlipperSpecs {
  section: string;
  driverInterface: "SPI" | "UART" | "Step/Dir";
  supportsDiagPin?: boolean;
  supportsSensorlessHoming?: boolean;
}

export interface StepperDriverPhysicalSpecs {
  packageType?: string;
  dimensions?: string;
  operatingTemperature?: string;
}

export interface StepperDriver {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  driverInterface: "SPI" | "UART" | "Step/Dir";
  electricalSpecs: StepperDriverElectricalSpecs;
  featureSpecs: StepperDriverFeatureSpecs;
  klipperSpecs: StepperDriverKlipperSpecs;
  physicalSpecs?: StepperDriverPhysicalSpecs;
  unverified?: string[];
  references?: StepperDriverReference[];
  relatedArticles?: RelatedArticle[];
}

export interface StepperDriverIndex {
  stepperDrivers: StepperDriverIndexEntry[];
}

export interface PcbLayoutIndex {
  layouts: PcbLayoutIndexEntry[];
}

export interface DocIndices {
  boards: McuBoardIndexEntry[];
  printers: PrinterIndexEntry[];
  motors: StepperMotorIndexEntry[];
  probes: ProbeIndexEntry[];
  fans: FanIndexEntry[];
  thermistors: ThermistorIndexEntry[];
  extruders: ExtruderIndexEntry[];
  hotends: HotendIndexEntry[];
  powerSupplies: PowerSupplyIndexEntry[];
  accessories: AccessoryIndexEntry[];
  filaments: FilamentIndexEntry[];
  displays: DisplayIndexEntry[];
  toolheads: ToolheadIndexEntry[];
  mmus: MmuIndexEntry[];
  pcbLayouts: PcbLayoutIndexEntry[];
  stepperDrivers: StepperDriverIndexEntry[];
}
