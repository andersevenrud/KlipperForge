import { expect, test } from "../fixtures/app.fixture";

const CONFIG_WITH_SAVE_CONFIG = `[mcu]
serial: /dev/ttyUSB0

[printer]
kinematics: cartesian
max_velocity: 300
max_accel: 3000

[extruder]
step_pin: PA0
dir_pin: PA1
enable_pin: !PA2
microsteps: 16
rotation_distance: 33.5
nozzle_diameter: 0.400
filament_diameter: 1.750
heater_pin: PA3
sensor_type: EPCOS 100K B57560G104F
sensor_pin: PA4
min_temp: 0
max_temp: 250

#*# <---------------------- SAVE_CONFIG ---------------------->
#*# DO NOT EDIT THIS BLOCK OR BELOW. The contents are auto-generated.
#*#
#*# [extruder]
#*# control = pid
#*# pid_kp = 23.306
#*# pid_ki = 1.689
#*# pid_kd = 80.407
`;

test.describe("SAVE_CONFIG overrides", () => {
  test("expanding [extruder] does not leak SAVE_CONFIG pid values into the section body", async ({ app }) => {
    await app.page.setViewportSize({ width: 1600, height: 1000 });
    await app.goto();
    // Wipe any leftover draft state from prior runs against the shared dev server.
    await app.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await app.goto();

    // Start from a blank config so the pasted one is the only [extruder] present.
    await app.openNewConfigDialog();
    await app.page.getByRole("button", { name: "Blank Configuration" }).click();

    // Import a config that has PID values exclusively inside the SAVE_CONFIG block
    // and none in the [extruder] body.
    await app.page.getByRole("button", { name: "Import" }).click();
    await app.page.getByRole("menuitem", { name: "Paste from clipboard..." }).click();
    const dialog = app.page.getByRole("dialog");
    await dialog.getByRole("textbox").fill(CONFIG_WITH_SAVE_CONFIG);
    await dialog.getByRole("button", { name: "Import", exact: true }).click();

    // SAVE_CONFIG block must be preserved on import.
    await app.expectEditorContains("#*# pid_kp = 23.306");

    const editor = app.editorContent();

    // Before expanding: PID values must only appear in SAVE_CONFIG form (with `=`),
    // never in the section body form (with `:`). The regression would append
    // `pid_kp: 23.306` etc. to the [extruder] body.
    await expect(editor).not.toContainText("pid_kp: 23.306");
    await expect(editor).not.toContainText("control: pid");

    // Expand the [extruder] section — this is exactly the action that used to
    // trigger the leak, because SectionEditor seeded the override values into
    // its form and then dispatched them back into section.data on mount. Scope
    // by data-section-header so we don't also match the "#*# extruder" SAVE_CONFIG
    // entry that shares the same visible label.
    const extruderTrigger = app.page.locator('[data-section-header="extruder"] button').first();
    await extruderTrigger.click();
    await expect(extruderTrigger).toHaveAttribute("aria-expanded", "true");
    // Wait for any section-data dispatch (debounced ~80ms) triggered by the
    // form mount to flush into the editor output.
    await expect(app.page.locator('[data-field-id="extruder-heater_pin"]')).toBeVisible();

    // After expansion: body must still be free of the SAVE_CONFIG values.
    await expect(editor).not.toContainText("pid_kp: 23.306");
    await expect(editor).not.toContainText("pid_ki: 1.689");
    await expect(editor).not.toContainText("pid_kd: 80.407");
    await expect(editor).not.toContainText("control: pid");

    // And the SAVE_CONFIG block must still be intact.
    await app.expectEditorContains("#*# pid_kp = 23.306");
    await app.expectEditorContains("#*# pid_ki = 1.689");
    await app.expectEditorContains("#*# pid_kd = 80.407");
  });
});
