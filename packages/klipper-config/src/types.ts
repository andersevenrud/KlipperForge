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

export interface PrinterSection {
  kinematics: KinematicsType;
  max_velocity: number;
  max_accel: number;
  max_z_velocity?: number;
  max_z_accel?: number;
  square_corner_velocity?: number;
}

export interface StepperSection {
  step_pin: string;
  dir_pin: string;
  enable_pin: string;
  microsteps: number;
  rotation_distance: number;
  endstop_pin?: string;
  position_endstop?: number;
  position_min?: number;
  position_max?: number;
  homing_speed?: number;
  homing_retract_dist?: number;
}

export interface ExtruderSection {
  step_pin: string;
  dir_pin: string;
  enable_pin: string;
  microsteps: number;
  rotation_distance: number;
  nozzle_diameter: number;
  filament_diameter: number;
  heater_pin: string;
  sensor_type: string;
  sensor_pin: string;
  min_temp: number;
  max_temp: number;
  control?: string;
  pid_kp?: number;
  pid_ki?: number;
  pid_kd?: number;
}

export interface HeaterBedSection {
  heater_pin: string;
  sensor_type: string;
  sensor_pin: string;
  min_temp: number;
  max_temp: number;
  control?: string;
  pid_kp?: number;
  pid_ki?: number;
  pid_kd?: number;
}

export interface FanSection {
  pin: string;
  max_power?: number;
  kick_start_time?: number;
}

export interface ProbeSection {
  pin: string;
  x_offset?: number;
  y_offset?: number;
  z_offset?: number;
  speed?: number;
  samples?: number;
}

export interface McuSection {
  serial: string;
  baud?: number;
  restart_method?: string;
}

import type { IniSection } from "@klipperforge/configparser";

export interface ConfigSection extends IniSection {
  annotation?: string;
  rawText?: string;
}

export interface PrinterConfig {
  printer: PrinterSection;
  mcu: McuSection;
  stepper_x: StepperSection;
  stepper_y: StepperSection;
  stepper_z: StepperSection;
  extruder: ExtruderSection;
  heater_bed?: HeaterBedSection;
  fan?: FanSection;
  heater_fan?: FanSection & { heater: string; heater_temp?: number };
  probe?: ProbeSection;
  additionalSections: ConfigSection[];
  macros?: string[];
}
