import {
  loadAccessory,
  loadDisplay,
  loadExtruder,
  loadFan,
  loadFilament,
  loadHotend,
  loadMcuBoard,
  loadMmu,
  loadPowerSupply,
  loadProbe,
  loadStepperDriver,
  loadStepperMotor,
  loadThermistor,
} from "@klipperforge/printer-data";
import type { DocCategory } from "./DocumentationView";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DataRecord = Record<string, unknown>;
type SpecValue = string | number | boolean | null | undefined;

interface ComparisonSpecRow {
  label: string;
  accessor: (data: DataRecord) => SpecValue;
  suffix?: string;
  format?: "boolean";
}

interface ComparisonSpecSection {
  title: string;
  rows: ComparisonSpecRow[];
}

export interface ComparisonCategoryConfig {
  loader: (id: string) => Promise<unknown>;
  nameAccessor: (data: DataRecord) => string;
  sections: ComparisonSpecSection[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nested(path: string): (data: DataRecord) => SpecValue {
  return (data) => {
    const parts = path.split(".");
    let current: unknown = data;
    for (const part of parts) {
      if (current == null || typeof current !== "object") return undefined;
      current = (current as DataRecord)[part];
    }
    return current as SpecValue;
  };
}

function arrayJoin(path: string): (data: DataRecord) => SpecValue {
  return (data) => {
    const val = nested(path)(data);
    return Array.isArray(val) ? val.join(", ") : undefined;
  };
}

// ---------------------------------------------------------------------------
// Per-category configs
// ---------------------------------------------------------------------------

export const COMPARISON_CONFIGS: Partial<Record<DocCategory, ComparisonCategoryConfig>> = {
  fans: {
    loader: loadFan,
    nameAccessor: (d) => d.name as string,
    sections: [
      {
        title: "Airflow",
        rows: [
          { label: "Airflow", accessor: nested("airflowSpecs.airflow"), suffix: " CFM" },
          { label: "Static Pressure", accessor: nested("airflowSpecs.staticPressure"), suffix: " mmH\u2082O" },
          { label: "RPM", accessor: nested("airflowSpecs.rpm") },
          { label: "RPM Range", accessor: nested("airflowSpecs.rpmRange") },
        ],
      },
      {
        title: "Electrical",
        rows: [
          { label: "Voltage", accessor: nested("electricalSpecs.voltage"), suffix: " V DC" },
          { label: "Current", accessor: nested("electricalSpecs.current"), suffix: " A" },
          { label: "Power", accessor: nested("electricalSpecs.power"), suffix: " W" },
          { label: "PWM Capable", accessor: nested("electricalSpecs.pwmCapable"), format: "boolean" },
          { label: "Tachometer", accessor: nested("electricalSpecs.tachoSignal"), format: "boolean" },
        ],
      },
      {
        title: "Noise",
        rows: [{ label: "Noise Level", accessor: nested("noiseSpecs.noiseLevel"), suffix: " dBA" }],
      },
      {
        title: "Physical",
        rows: [
          { label: "Dimensions", accessor: nested("physicalSpecs.dimensions") },
          { label: "Weight", accessor: nested("physicalSpecs.weight"), suffix: " g" },
          { label: "Bearing Type", accessor: nested("physicalSpecs.bearingType") },
          { label: "Connector", accessor: nested("physicalSpecs.connectorType") },
          { label: "Lead Wire Length", accessor: nested("physicalSpecs.leadWireLength"), suffix: " mm" },
        ],
      },
    ],
  },

  filaments: {
    loader: loadFilament,
    nameAccessor: (d) => d.name as string,
    sections: [
      {
        title: "Ratings",
        rows: [
          { label: "Strength", accessor: nested("ratings.strength") },
          { label: "Stiffness", accessor: nested("ratings.stiffness") },
          { label: "Durability", accessor: nested("ratings.durability") },
          { label: "Printability", accessor: nested("ratings.printability") },
          { label: "Heat Resistance", accessor: nested("ratings.heatResistance") },
        ],
      },
      {
        title: "Print Settings",
        rows: [
          { label: "Nozzle Temperature", accessor: nested("printSpecs.nozzleTempRange") },
          { label: "Bed Temperature", accessor: nested("printSpecs.bedTempRange") },
          { label: "First Layer Temp", accessor: nested("printSpecs.firstLayerTemp") },
          { label: "Print Speed", accessor: nested("printSpecs.printSpeedRange") },
          { label: "Cooling Fan", accessor: nested("printSpecs.coolingFan") },
          { label: "Enclosure Required", accessor: nested("printSpecs.enclosureRequired"), format: "boolean" },
        ],
      },
      {
        title: "Mechanical",
        rows: [
          { label: "Tensile Strength", accessor: nested("mechanicalSpecs.tensileStrength"), suffix: " MPa" },
          { label: "Heat Deflection Temp", accessor: nested("mechanicalSpecs.heatDeflectionTemp"), suffix: " \u00B0C" },
          { label: "Elongation at Break", accessor: nested("mechanicalSpecs.elongationAtBreak"), suffix: " %" },
          { label: "Shore Hardness", accessor: nested("mechanicalSpecs.shoreHardness") },
          { label: "Impact Strength", accessor: nested("mechanicalSpecs.impactStrength") },
        ],
      },
      {
        title: "Environmental",
        rows: [
          { label: "Moisture Sensitivity", accessor: nested("environmentalSpecs.moistureSensitivity") },
          { label: "UV Resistance", accessor: nested("environmentalSpecs.uvResistance") },
          { label: "Food Safe", accessor: nested("environmentalSpecs.foodSafe"), format: "boolean" },
          { label: "Drying Temperature", accessor: nested("environmentalSpecs.dryingTemp"), suffix: " \u00B0C" },
          { label: "Drying Time", accessor: nested("environmentalSpecs.dryingTime"), suffix: " hours" },
        ],
      },
      {
        title: "Physical",
        rows: [
          { label: "Diameter", accessor: nested("physicalSpecs.diameter"), suffix: " mm" },
          { label: "Density", accessor: nested("physicalSpecs.density"), suffix: " g/cm\u00B3" },
          { label: "Glass Transition Temp", accessor: nested("physicalSpecs.glassTransitionTemp"), suffix: " \u00B0C" },
          { label: "Melting Point", accessor: nested("physicalSpecs.meltingPoint"), suffix: " \u00B0C" },
        ],
      },
    ],
  },

  "stepper-drivers": {
    loader: loadStepperDriver,
    nameAccessor: (d) => d.name as string,
    sections: [
      {
        title: "Overview",
        rows: [
          { label: "Manufacturer", accessor: nested("manufacturer") },
          { label: "Base Chip", accessor: nested("baseChip") },
          { label: "Form Factor", accessor: nested("formFactor") },
          { label: "Interface", accessor: nested("driverInterface") },
        ],
      },
      {
        title: "Electrical",
        rows: [
          { label: "Supply Voltage Min", accessor: nested("electricalSpecs.supplyVoltageMin"), suffix: " V" },
          { label: "Supply Voltage Max", accessor: nested("electricalSpecs.supplyVoltageMax"), suffix: " V" },
          { label: "RMS Current Max", accessor: nested("electricalSpecs.rmsCurrentMax"), suffix: " A" },
          { label: "Peak Current Max", accessor: nested("electricalSpecs.peakCurrentMax"), suffix: " A" },
          { label: "Logic Voltage Min", accessor: nested("electricalSpecs.logicVoltageMin"), suffix: " V" },
          { label: "Logic Voltage Max", accessor: nested("electricalSpecs.logicVoltageMax"), suffix: " V" },
          { label: "Sense Resistor", accessor: nested("electricalSpecs.senseResistor"), suffix: " \u03A9" },
          { label: "Rref", accessor: nested("electricalSpecs.rref"), suffix: " \u03A9" },
        ],
      },
      {
        title: "Features",
        rows: [
          { label: "Max Microsteps", accessor: nested("featureSpecs.microstepsMax") },
          { label: "Interpolation to 256", accessor: nested("featureSpecs.interpolationTo256"), format: "boolean" },
          { label: "StealthChop", accessor: nested("featureSpecs.stealthChop") },
          { label: "SpreadCycle", accessor: nested("featureSpecs.spreadCycle"), format: "boolean" },
          { label: "CoolStep", accessor: nested("featureSpecs.coolStep"), format: "boolean" },
          { label: "StallGuard", accessor: nested("featureSpecs.stallGuard") },
          { label: "dcStep", accessor: nested("featureSpecs.dcStep"), format: "boolean" },
          { label: "Sensorless Homing", accessor: nested("featureSpecs.sensorlessHoming"), format: "boolean" },
        ],
      },
      {
        title: "Klipper",
        rows: [
          { label: "Config Section", accessor: nested("klipperSpecs.section") },
          { label: "Interface", accessor: nested("klipperSpecs.driverInterface") },
          { label: "Supports DIAG Pin", accessor: nested("klipperSpecs.supportsDiagPin"), format: "boolean" },
          {
            label: "Supports Sensorless Homing",
            accessor: nested("klipperSpecs.supportsSensorlessHoming"),
            format: "boolean",
          },
        ],
      },
      {
        title: "Physical",
        rows: [
          { label: "Package Type", accessor: nested("physicalSpecs.packageType") },
          { label: "Dimensions", accessor: nested("physicalSpecs.dimensions") },
          { label: "Operating Temperature", accessor: nested("physicalSpecs.operatingTemperature") },
        ],
      },
    ],
  },

  "stepper-motors": {
    loader: loadStepperMotor,
    nameAccessor: (d) => d.name as string,
    sections: [
      {
        title: "Electrical",
        rows: [
          { label: "Rated Current", accessor: nested("electricalSpecs.ratedCurrent"), suffix: " A" },
          { label: "Holding Torque", accessor: nested("electricalSpecs.holdingTorque"), suffix: " Ncm" },
          { label: "Step Angle", accessor: nested("electricalSpecs.stepAngle"), suffix: "\u00B0" },
          { label: "Phase Resistance", accessor: nested("electricalSpecs.phaseResistance"), suffix: " \u03A9" },
          { label: "Phase Inductance", accessor: nested("electricalSpecs.phaseInductance"), suffix: " mH" },
          { label: "Rated Voltage", accessor: nested("electricalSpecs.ratedVoltage"), suffix: " V" },
        ],
      },
      {
        title: "Physical",
        rows: [
          { label: "NEMA Size", accessor: nested("nemaSize") },
          { label: "Body Length", accessor: nested("physicalSpecs.bodyLength"), suffix: " mm" },
          { label: "Weight", accessor: nested("physicalSpecs.weight"), suffix: " g" },
          { label: "Shaft Diameter", accessor: nested("physicalSpecs.shaftDiameter"), suffix: " mm" },
          { label: "Shaft Length", accessor: nested("physicalSpecs.shaftLength"), suffix: " mm" },
          { label: "Connector", accessor: nested("connectorType") },
          { label: "Temperature Rating", accessor: nested("temperatureRating"), suffix: " \u00B0C" },
        ],
      },
    ],
  },

  probes: {
    loader: loadProbe,
    nameAccessor: (d) => d.name as string,
    sections: [
      {
        title: "Electrical",
        rows: [
          { label: "Operating Voltage", accessor: nested("electricalSpecs.operatingVoltage") },
          { label: "Signal Type", accessor: nested("electricalSpecs.signalType") },
          { label: "Current Draw", accessor: nested("electricalSpecs.currentDraw") },
        ],
      },
      {
        title: "Performance",
        rows: [
          { label: "Repeatability", accessor: nested("performanceSpecs.repeatability") },
          { label: "Trigger Distance", accessor: nested("performanceSpecs.triggerDistance") },
          { label: "Bed Compatibility", accessor: arrayJoin("performanceSpecs.bedCompatibility") },
          {
            label: "Temperature Compensation",
            accessor: nested("performanceSpecs.temperatureCompensation"),
            format: "boolean",
          },
          { label: "Mesh Leveling", accessor: nested("performanceSpecs.multiPoint"), format: "boolean" },
        ],
      },
      {
        title: "Physical",
        rows: [
          { label: "Dimensions", accessor: nested("physicalSpecs.dimensions") },
          { label: "Weight", accessor: nested("physicalSpecs.weight"), suffix: " g" },
          { label: "Mount Type", accessor: nested("physicalSpecs.mountType") },
        ],
      },
    ],
  },

  thermistors: {
    loader: loadThermistor,
    nameAccessor: (d) => d.name as string,
    sections: [
      {
        title: "Sensing",
        rows: [
          { label: "Resistance at 25\u00B0C", accessor: nested("sensingSpecs.resistanceAt25C") },
          { label: "Beta Value (B25/50)", accessor: nested("sensingSpecs.betaValue"), suffix: " K" },
          { label: "Temperature Range", accessor: nested("sensingSpecs.temperatureRange") },
          { label: "Accuracy", accessor: nested("sensingSpecs.accuracy") },
          { label: "Response Time", accessor: nested("sensingSpecs.responseTime") },
        ],
      },
      {
        title: "Klipper",
        rows: [
          { label: "Sensor Type", accessor: nested("klipperSpecs.sensorType") },
          { label: "Requires Amplifier", accessor: nested("klipperSpecs.requiresAmplifier"), format: "boolean" },
          { label: "Pullup Resistor", accessor: nested("klipperSpecs.pullupResistor") },
        ],
      },
      {
        title: "Physical",
        rows: [
          { label: "Package Type", accessor: nested("physicalSpecs.packageType") },
          { label: "Dimensions", accessor: nested("physicalSpecs.dimensions") },
          { label: "Lead Type", accessor: nested("physicalSpecs.leadType") },
        ],
      },
    ],
  },

  extruders: {
    loader: loadExtruder,
    nameAccessor: (d) => d.name as string,
    sections: [
      {
        title: "Mechanical",
        rows: [
          { label: "Drive Type", accessor: nested("driveType") },
          { label: "Gear Ratio", accessor: nested("mechanicalSpecs.gearRatio") },
          { label: "Filament Diameter", accessor: nested("mechanicalSpecs.filamentDiameter"), suffix: " mm" },
          { label: "Grip Type", accessor: nested("mechanicalSpecs.gripType") },
          { label: "Max Feed Rate", accessor: nested("mechanicalSpecs.maxFeedRate"), suffix: " mm/s" },
        ],
      },
      {
        title: "Motor",
        rows: [
          { label: "Motor Included", accessor: nested("motorSpecs.includedMotor"), format: "boolean" },
          { label: "Motor Type", accessor: nested("motorSpecs.motorType") },
          { label: "Compatible Motors", accessor: nested("motorSpecs.compatibleMotors") },
        ],
      },
      {
        title: "Physical",
        rows: [
          { label: "Weight", accessor: nested("physicalSpecs.weight"), suffix: " g" },
          { label: "Dimensions", accessor: nested("physicalSpecs.dimensions") },
          { label: "Mount Pattern", accessor: nested("physicalSpecs.mountPattern") },
        ],
      },
    ],
  },

  hotends: {
    loader: loadHotend,
    nameAccessor: (d) => d.name as string,
    sections: [
      {
        title: "Thermal",
        rows: [
          { label: "Max Temperature", accessor: nested("thermalSpecs.maxTemperature"), suffix: " \u00B0C" },
          { label: "Heater Type", accessor: nested("thermalSpecs.heaterType") },
          { label: "Heater Power", accessor: nested("thermalSpecs.heaterPower"), suffix: " W" },
          { label: "Heat-Up Time", accessor: nested("thermalSpecs.heatUpTime") },
          { label: "Thermistor", accessor: nested("thermalSpecs.thermistorType") },
        ],
      },
      {
        title: "Heat Break",
        rows: [
          { label: "Type", accessor: nested("heatBreakSpecs.type") },
          { label: "Material", accessor: nested("heatBreakSpecs.material") },
          { label: "Retraction", accessor: nested("heatBreakSpecs.retraction") },
        ],
      },
      {
        title: "Nozzle",
        rows: [
          { label: "Nozzle System", accessor: nested("nozzleSpecs.system") },
          { label: "Included Nozzle", accessor: nested("nozzleSpecs.includedNozzleSizeMm"), suffix: " mm" },
          { label: "Compatible Nozzles", accessor: arrayJoin("nozzleSpecs.compatibleNozzles") },
          { label: "Max Flow Rate", accessor: nested("nozzleSpecs.maxFlowRate") },
        ],
      },
      {
        title: "Physical",
        rows: [
          { label: "Filament Diameter", accessor: nested("physicalSpecs.filamentDiameter"), suffix: " mm" },
          { label: "Weight", accessor: nested("physicalSpecs.weight"), suffix: " g" },
          { label: "Dimensions", accessor: nested("physicalSpecs.dimensions") },
          { label: "Mount Type", accessor: nested("physicalSpecs.mountType") },
        ],
      },
    ],
  },

  "power-supplies": {
    loader: loadPowerSupply,
    nameAccessor: (d) => d.name as string,
    sections: [
      {
        title: "Electrical",
        rows: [
          { label: "Output Voltage", accessor: nested("electricalSpecs.outputVoltage"), suffix: " V DC" },
          { label: "Output Current", accessor: nested("electricalSpecs.outputCurrent"), suffix: " A" },
          { label: "Output Power", accessor: nested("electricalSpecs.outputPower"), suffix: " W" },
          { label: "Input Voltage", accessor: nested("electricalSpecs.inputVoltageRange") },
          { label: "Efficiency", accessor: nested("electricalSpecs.efficiency"), suffix: " %" },
          {
            label: "Power Factor Correction",
            accessor: nested("electricalSpecs.powerFactorCorrection"),
            format: "boolean",
          },
        ],
      },
      {
        title: "Physical",
        rows: [
          { label: "Dimensions", accessor: nested("physicalSpecs.dimensions") },
          { label: "Weight", accessor: nested("physicalSpecs.weight"), suffix: " g" },
          { label: "Cooling", accessor: nested("physicalSpecs.coolingMethod") },
          { label: "Operating Temperature", accessor: nested("operatingTemperature") },
        ],
      },
    ],
  },

  "mcu-boards": {
    loader: loadMcuBoard,
    nameAccessor: (d) => d.name as string,
    sections: [
      {
        title: "MCU",
        rows: [
          { label: "MCU", accessor: nested("mcu") },
          { label: "Max Motor Voltage", accessor: nested("maxMotorVoltage"), suffix: " V" },
        ],
      },
      {
        title: "Drivers",
        rows: [
          { label: "Driver Count", accessor: nested("drivers.count") },
          { label: "Driver Model", accessor: nested("drivers.model") },
          { label: "Driver Connector", accessor: nested("drivers.connector") },
        ],
      },
      {
        title: "Dimensions",
        rows: [
          { label: "Width", accessor: nested("dimensions.width"), suffix: " mm" },
          { label: "Height", accessor: nested("dimensions.height"), suffix: " mm" },
        ],
      },
    ],
  },

  displays: {
    loader: loadDisplay,
    nameAccessor: (d) => d.name as string,
    sections: [
      {
        title: "Screen",
        rows: [
          { label: "Size", accessor: nested("screenSpecs.size") },
          { label: "Resolution", accessor: nested("screenSpecs.resolution") },
          { label: "Panel Type", accessor: nested("screenSpecs.panelType") },
          { label: "Touchscreen", accessor: nested("screenSpecs.touchscreen"), format: "boolean" },
          { label: "Driver IC", accessor: nested("screenSpecs.driver") },
        ],
      },
      {
        title: "Connection",
        rows: [
          { label: "Interface", accessor: nested("connectionSpecs.interface") },
          { label: "Connector", accessor: nested("connectionSpecs.connector") },
        ],
      },
      {
        title: "Klipper Integration",
        rows: [
          { label: "Method", accessor: nested("klipperIntegration.method") },
          { label: "Display Type", accessor: nested("klipperIntegration.klipperDisplayType") },
          { label: "Requires SBC", accessor: nested("klipperIntegration.requiresSbc"), format: "boolean" },
          { label: "Software", accessor: nested("klipperIntegration.softwareRequired") },
        ],
      },
      {
        title: "Compute",
        rows: [
          { label: "Processor", accessor: nested("computeSpecs.processor") },
          { label: "RAM", accessor: nested("computeSpecs.ram") },
          { label: "WiFi", accessor: nested("computeSpecs.wifi"), format: "boolean" },
          { label: "Battery", accessor: nested("computeSpecs.battery"), format: "boolean" },
        ],
      },
      {
        title: "Physical",
        rows: [
          { label: "Dimensions", accessor: nested("physicalSpecs.dimensions") },
          { label: "Weight", accessor: nested("physicalSpecs.weight"), suffix: " g" },
          { label: "Mount Type", accessor: nested("physicalSpecs.mountType") },
        ],
      },
    ],
  },

  mmus: {
    loader: loadMmu,
    nameAccessor: (d) => d.name as string,
    sections: [
      {
        title: "Filament",
        rows: [
          { label: "Filament Capacity", accessor: nested("filamentSpecs.filamentCapacity") },
          { label: "Scalable", accessor: nested("filamentSpecs.scalable"), format: "boolean" },
          { label: "Max Filaments", accessor: nested("filamentSpecs.maxFilaments") },
          { label: "Filament Diameter", accessor: nested("filamentSpecs.filamentDiameter"), suffix: " mm" },
        ],
      },
      {
        title: "Mechanical",
        rows: [
          { label: "Drive Type", accessor: nested("mechanicalSpecs.driveType") },
          { label: "Motor Count", accessor: nested("mechanicalSpecs.motorCount") },
          { label: "Buffer Required", accessor: nested("mechanicalSpecs.bufferRequired"), format: "boolean" },
          { label: "Buffer Type", accessor: nested("mechanicalSpecs.bufferType") },
        ],
      },
      {
        title: "Software",
        rows: [{ label: "Klipper Driver", accessor: nested("softwareSpecs.klipperDriver") }],
      },
      {
        title: "General",
        rows: [
          { label: "Open Source", accessor: nested("openSource"), format: "boolean" },
          { label: "License", accessor: nested("license") },
          { label: "Printable", accessor: nested("physicalSpecs.printable"), format: "boolean" },
          { label: "Material", accessor: nested("physicalSpecs.material") },
        ],
      },
    ],
  },

  accessories: {
    loader: loadAccessory,
    nameAccessor: (d) => d.name as string,
    sections: [
      {
        title: "Electrical",
        rows: [
          { label: "Voltage", accessor: nested("electricalSpecs.voltage") },
          { label: "Signal Type", accessor: nested("electricalSpecs.signalType") },
        ],
      },
      {
        title: "Physical",
        rows: [
          { label: "Dimensions", accessor: nested("physicalSpecs.dimensions") },
          { label: "Weight", accessor: nested("physicalSpecs.weight"), suffix: " g" },
          { label: "Filament Diameter", accessor: nested("physicalSpecs.filamentDiameter"), suffix: " mm" },
        ],
      },
    ],
  },
};
