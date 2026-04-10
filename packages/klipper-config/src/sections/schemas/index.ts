// TMC driver wrappers with allowedFieldPattern for driver_* register overrides
// live in ./tmc; we re-export them here instead of using the generated versions.
import { temperatureFanDefinition } from "../generated/fans";
import {
  adcTemperatureDefinition,
  heaterGenericDefinition,
  homingHeatersDefinition,
  thermistorDefinition,
  verifyHeaterDefinition,
} from "../generated/heating";
import { endstopPhaseDefinition, homingOverrideDefinition } from "../generated/homing";
import {
  bedScrewsDefinition,
  bedTiltDefinition,
  quadGantryLevelDefinition,
  screwsTiltAdjustDefinition,
  zThermalAdjustDefinition,
  zTiltDefinition,
} from "../generated/leveling";
import { gcodeArcsDefinition, gcodeButtonDefinition } from "../generated/macros";
import {
  displayStatusDefinition,
  excludeObjectDefinition,
  firmwareRetractionDefinition,
  forceMoveDefinition,
  idleTimeoutDefinition,
  pauseResumeDefinition,
  respondDefinition,
  saveVariablesDefinition,
  sx1509Definition,
  virtualSdcardDefinition,
} from "../generated/misc";
import { dualCarriageDefinition, extruderStepperDefinition, manualStepperDefinition } from "../generated/motion";
import {
  dotstarDefinition,
  ledDefinition,
  multiPinDefinition,
  neopixelDefinition,
  outputPinDefinition,
  pca9533Definition,
  pca9632Definition,
  pwmCycleTimeDefinition,
  pwmToolDefinition,
  servoDefinition,
} from "../generated/output";
import {
  axisTwistCompensationDefinition,
  probeEddyCurrentDefinition,
  smartEffectorDefinition,
} from "../generated/probing";
import {
  ads1x1xDefinition,
  adxl345Definition,
  angleDefinition,
  bmi160Definition,
  hallFilamentWidthSensorDefinition,
  icm20948Definition,
  lis2dwDefinition,
  lis3dhDefinition,
  loadCellDefinition,
  loadCellProbeDefinition,
  mpu9250Definition,
  temperatureProbeDefinition,
  tsl1401clFilamentWidthSensorDefinition,
} from "../generated/sensors";
import { resonanceTesterDefinition, skewCorrectionDefinition } from "../generated/tuning";
import { SectionRegistry } from "../registry";
import { beaconDefinition } from "./beacon";
import { bedMeshDefinition } from "./bed-mesh";
import { bltouchDefinition } from "./bltouch";
import { boardPinsDefinition, boardPinsNamedDefinition } from "./board-pins";
import {
  cartographerCoilDefinition,
  cartographerDefinition,
  cartographerScanDefinition,
  cartographerTouchDefinition,
} from "./cartographer";
import { controllerFanDefinition } from "./controller-fan";
import { delayedGcodeDefinition } from "./delayed-gcode";
import { extruderDefinition } from "./extruder";
import { fanDefinition } from "./fan";
import { fanGenericDefinition } from "./fan-generic";
import { filamentMotionSensorDefinition, filamentSwitchSensorDefinition } from "./filament-sensor";
import { gcodeMacroDefinition } from "./gcode-macro";
import { heaterBedDefinition } from "./heater-bed";
import { heaterFanDefinition } from "./heater-fan";
import { includeDefinition } from "./include";
import { inputShaperDefinition } from "./input-shaper";
import { ledEffectDefinition } from "./led-effect";
import { mcuDefinition, mcuNamedDefinition } from "./mcu";
import { printerDefinition } from "./printer";
import { probeDefinition } from "./probe";
import { safeZHomeDefinition } from "./safe-z-home";
import { shaketuneDefinition } from "./shaketune";
import { stepperDefinition } from "./stepper";
import { temperatureSensorDefinition } from "./temperature-sensor";
import {
  tmc2130Definition,
  tmc2208Definition,
  tmc2209Definition,
  tmc2240Definition,
  tmc2660Definition,
  tmc5160Definition,
} from "./tmc";
import { autotuneTmcDefinition, motorConstantsDefinition } from "./tmc-autotune";

export { beaconDefinition, beaconSchema } from "./beacon";
export { bedMeshDefinition, bedMeshSchema } from "./bed-mesh";
export { bltouchDefinition, bltouchSchema } from "./bltouch";
export {
  boardPinsDefinition,
  boardPinsNamedDefinition,
  boardPinsParams,
  boardPinsSchema,
} from "./board-pins";
export {
  cartographerCoilDefinition,
  cartographerCoilSchema,
  cartographerDefinition,
  cartographerScanDefinition,
  cartographerScanSchema,
  cartographerSchema,
  cartographerTouchDefinition,
  cartographerTouchSchema,
} from "./cartographer";
export { controllerFanDefinition, controllerFanSchema } from "./controller-fan";
export { extruderDefinition, extruderSchema } from "./extruder";
export { fanDefinition, fanSchema } from "./fan";
export { fanGenericDefinition, fanGenericSchema } from "./fan-generic";
export {
  filamentMotionSensorDefinition,
  filamentSensorSchema,
  filamentSwitchSensorDefinition,
} from "./filament-sensor";
export { heaterBedDefinition, heaterBedSchema } from "./heater-bed";
export { heaterFanDefinition, heaterFanSchema } from "./heater-fan";
export { inputShaperDefinition, inputShaperSchema } from "./input-shaper";
export { mcuDefinition, mcuNamedDefinition, mcuSchema } from "./mcu";
export { printerDefinition, printerSchema } from "./printer";
export { probeDefinition, probeSchema } from "./probe";
export { safeZHomeDefinition, safeZHomeSchema } from "./safe-z-home";
export { stepperDefinition, stepperSchema } from "./stepper";
export {
  temperatureSensorDefinition,
  temperatureSensorSchema,
} from "./temperature-sensor";
export { tmc2209Definition, tmc5160Definition, tmcSchema } from "./tmc";

export function createDefaultRegistry(): SectionRegistry {
  const registry = new SectionRegistry();

  // Include
  registry.register(includeDefinition);

  // Core sections (hand-written)
  registry.register(printerDefinition);
  registry.register(mcuDefinition);
  registry.register(mcuNamedDefinition);
  registry.register(boardPinsDefinition);
  registry.register(boardPinsNamedDefinition);
  registry.register(stepperDefinition);
  registry.register(extruderDefinition);
  registry.register(heaterBedDefinition);
  registry.register(fanDefinition);
  registry.register(fanGenericDefinition);
  registry.register(heaterFanDefinition);
  registry.register(controllerFanDefinition);
  registry.register(probeDefinition);
  registry.register(bltouchDefinition);
  registry.register(bedMeshDefinition);
  registry.register(safeZHomeDefinition);
  registry.register(inputShaperDefinition);
  registry.register(tmc2209Definition);
  registry.register(tmc5160Definition);
  registry.register(filamentSwitchSensorDefinition);
  registry.register(filamentMotionSensorDefinition);
  registry.register(temperatureSensorDefinition);
  registry.register(cartographerDefinition);
  registry.register(cartographerScanDefinition);
  registry.register(cartographerTouchDefinition);
  registry.register(cartographerCoilDefinition);
  registry.register(beaconDefinition);

  // Generated: motion
  registry.register(dualCarriageDefinition);
  registry.register(extruderStepperDefinition);
  registry.register(manualStepperDefinition);

  // Generated: heating
  registry.register(heaterGenericDefinition);
  registry.register(verifyHeaterDefinition);
  registry.register(homingHeatersDefinition);
  registry.register(thermistorDefinition);
  registry.register(adcTemperatureDefinition);

  // Generated: fans
  registry.register(temperatureFanDefinition);

  // Generated: probing
  registry.register(smartEffectorDefinition);
  registry.register(probeEddyCurrentDefinition);
  registry.register(axisTwistCompensationDefinition);

  // Generated: leveling
  registry.register(bedTiltDefinition);
  registry.register(bedScrewsDefinition);
  registry.register(screwsTiltAdjustDefinition);
  registry.register(zTiltDefinition);
  registry.register(quadGantryLevelDefinition);
  registry.register(zThermalAdjustDefinition);

  // Generated: homing
  registry.register(homingOverrideDefinition);
  registry.register(endstopPhaseDefinition);

  // Generated: tuning
  registry.register(skewCorrectionDefinition);
  registry.register(resonanceTesterDefinition);

  // Generated: drivers
  registry.register(tmc2130Definition);
  registry.register(tmc2208Definition);
  registry.register(tmc2240Definition);
  registry.register(tmc2660Definition);

  // Generated: sensors
  registry.register(adxl345Definition);
  registry.register(icm20948Definition);
  registry.register(lis2dwDefinition);
  registry.register(lis3dhDefinition);
  registry.register(bmi160Definition);
  registry.register(mpu9250Definition);
  registry.register(temperatureProbeDefinition);
  registry.register(tsl1401clFilamentWidthSensorDefinition);
  registry.register(hallFilamentWidthSensorDefinition);
  registry.register(loadCellDefinition);
  registry.register(loadCellProbeDefinition);
  registry.register(ads1x1xDefinition);
  registry.register(angleDefinition);

  // Generated: output
  registry.register(ledDefinition);
  registry.register(neopixelDefinition);
  registry.register(dotstarDefinition);
  registry.register(pca9533Definition);
  registry.register(pca9632Definition);
  registry.register(servoDefinition);
  registry.register(outputPinDefinition);
  registry.register(pwmToolDefinition);
  registry.register(pwmCycleTimeDefinition);
  registry.register(multiPinDefinition);

  // Generated: macros
  registry.register(gcodeMacroDefinition);
  registry.register(delayedGcodeDefinition);
  registry.register(gcodeArcsDefinition);
  registry.register(gcodeButtonDefinition);

  // Plugins
  registry.register(ledEffectDefinition);
  registry.register(shaketuneDefinition);
  registry.register(autotuneTmcDefinition);
  registry.register(motorConstantsDefinition);

  // Generated: misc
  registry.register(saveVariablesDefinition);
  registry.register(idleTimeoutDefinition);
  registry.register(virtualSdcardDefinition);
  registry.register(forceMoveDefinition);
  registry.register(pauseResumeDefinition);
  registry.register(firmwareRetractionDefinition);
  registry.register(respondDefinition);
  registry.register(excludeObjectDefinition);
  registry.register(displayStatusDefinition);
  registry.register(sx1509Definition);

  return registry;
}

export const defaultRegistry = createDefaultRegistry();
