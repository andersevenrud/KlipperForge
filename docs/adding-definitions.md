# Adding Definitions

All definitions live in `data/` as JSON files. Each directory has an `index.json` that registers available entries.

| Directory | Contents |
|---|---|
| `printers/` | Printer presets (kinematics, bed size, stepper config) |
| `mcu-boards/` | MCU board definitions (pins, interfaces, MCU type) |
| `equipment/` | Peripheral hardware — stepper drivers, etc. |
| `accessories/` | Filament sensors, runout detectors |
| `displays/` | Touchscreens and display modules |
| `extruders/` | Extruder assemblies (BMG, LGX, Hemera, etc.) |
| `fans/` | Cooling fans (axial, blower) |
| `filaments/` | Filament profiles (temperatures, settings) |
| `hotends/` | Hotend assemblies |
| `power-supplies/` | Power supply units |
| `probes/` | Bed probes (BLTouch, Beacon, inductive, etc.) |
| `stepper-motors/` | Stepper motor specifications |
| `thermistors/` | Thermistor profiles and coefficients |
| `toolheads/` | Toolhead assemblies (Stealthburner, Dragon Burner, etc.) |
| `mmus/` | Multi-material units (ERCF, Box Turtle, Tradrack, etc.) |
| `macros/` | G-code macro templates grouped by category |
| `firmware-presets/` | Kconfig options per MCU family for firmware compilation |
| `pcb-layouts/` | Board pin-out visualizations extracted from annotated SVGs |

## Printer Presets

1. Create a JSON file in `data/printers/<id>.json` following the `PrinterPreset` schema
2. Add the entry to `data/printers/index.json`

## MCU Boards

1. Create a JSON file in `data/mcu-boards/<id>.json` following the `McuBoard` schema
2. Add the entry to `data/mcu-boards/index.json`

## Equipment

1. Add an entry to the relevant JSON file in `data/equipment/`
2. Register it in the corresponding `index.json`

## Macros

1. Add an entry to the relevant JSON file in `data/macros/`
2. Register it in the corresponding `index.json`

## Firmware Presets

Preset JSON files in `data/firmware-presets/` define Kconfig options per MCU family. Board-to-preset resolution: load board JSON, read `mcu` field, match against preset `mcuPatterns`.

## PCB Layouts

Extract from annotated SVGs:

```bash
bun run scripts/extract-pcb-layout.ts <input.svg> <board-id> [name] [--image path]
```

The SVG must contain `<rect>` elements with `data-klipperforge-*` attributes (name, category, pins, pin-hints, orientation, rows).
