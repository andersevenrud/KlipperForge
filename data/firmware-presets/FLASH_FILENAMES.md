# SD Card Flash Filenames

When flashing firmware via SD card, the bootloader expects a specific filename. Most boards use `firmware.bin`, but some vendors require a different name.

## Known Flash Filenames

| Vendor | Board | Flash Filename | Notes |
|---|---|---|---|
| BTT (most boards) | SKR, Octopus, EBB, etc. | `firmware.bin` | Default; omit `flashFilename` |
| MKS | Robin E3 | `Robin_e3.bin` | Case-sensitive |
| MKS | Robin Nano v3 | `Robin_nano_v3.bin` | Case-sensitive |
| MKS | Robin Nano DW v2 | `Robin_nano.bin` | |
| MKS | Robin Lite | `mks_robin_lite.bin` | |
| MKS | Robin E3D | `Robin_e3d.bin` | |
| MKS | Monster8 | `mks_monster8.bin` | |
| MKS | Eagle | `mks_eagle.bin` | |
| Creality | v4.2.x boards | `firmware.bin` | Must be unique per flash (rename after each flash) |
| Chitu | v6 boards | `update.cbd` | Different extension |
| ZNP | Robin Nano | `ZNP_ROBIN_NANO.bin` | Case-sensitive |
| Qidi | X6 / X-Smart3 | `X_4.bin` | |
| Qidi | X7 / Q1 Pro | `qd_mcu.bin` | |
| Fysetc | Spider / Cheetah | `firmware.bin` | Default; omit `flashFilename` |
| Fly/Mellow | Flyboard Mini | `firmware.bin` | Default; omit `flashFilename` |

## Usage in Board JSON

Add `flashFilename` only when the board requires a non-default name:

```json
{
  "id": "mks-robin-e3",
  "name": "MKS Robin E3",
  "mcu": "STM32F103",
  "flashFilename": "Robin_e3.bin",
  "pins": [...]
}
```

When `flashFilename` is omitted, the download uses the preset's `outputFile` (typically `klipper.bin`).

## Source

Filenames sourced from Klipper's `scripts/spi_flash/board_defs.py`.

## Notes

- Filenames are case-sensitive on FAT32 SD cards formatted on Linux
- Creality boards require a unique filename each flash — some users append a timestamp
- MKS boards with HID bootloaders may need conversion via `HID_Flash.py` instead of SD card
