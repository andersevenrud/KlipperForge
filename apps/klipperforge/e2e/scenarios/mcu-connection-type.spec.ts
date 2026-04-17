import { expect, test } from "../fixtures/app.fixture";

test.describe("MCU connection type switching", () => {
  test("switching between serial and canbus shows correct fields and preserves values", async ({ app }) => {
    await app.goto();

    // The default config has an MCU with serial connection.
    // Expand the [mcu] section to access its form.
    await app.page.getByRole("button", { name: "[mcu]" }).click();

    // Initial state: Serial mode — serial/baud visible, canbus fields hidden
    await expect(app.sectionField("mcu", "serial")).toBeVisible();
    await expect(app.sectionField("mcu", "baud")).toBeVisible();
    await expect(app.sectionField("mcu", "restart_method")).toBeVisible();
    await expect(app.sectionField("mcu", "canbus_uuid")).toBeHidden();
    await expect(app.sectionField("mcu", "canbus_interface")).toBeHidden();

    // Step 1: Fill a custom serial value
    await app.sectionFieldInput("mcu", "serial").fill("/dev/ttyUSB0");
    await app.expectEditorSectionContains("mcu", "serial: /dev/ttyUSB0");

    // Step 2: Switch to CAN Bus — serial hidden, canbus fields visible
    await app.selectSectionMode("mcu", "CAN Bus");
    await expect(app.sectionField("mcu", "serial")).toBeHidden();
    await expect(app.sectionField("mcu", "canbus_uuid")).toBeVisible();
    await expect(app.sectionField("mcu", "canbus_interface")).toBeVisible();
    await expect(app.sectionField("mcu", "baud")).toBeVisible();
    await expect(app.sectionField("mcu", "restart_method")).toBeVisible();

    // Step 3: Fill canbus values
    await app.sectionFieldInput("mcu", "canbus_uuid").fill("abc123");
    await app.expectEditorSectionContains("mcu", "canbus_uuid: abc123");

    // Step 4: Switch back to Serial — serial visible with remembered value, canbus hidden
    await app.selectSectionMode("mcu", "Serial");
    await expect(app.sectionField("mcu", "serial")).toBeVisible();
    await expect(app.sectionField("mcu", "canbus_uuid")).toBeHidden();
    await expect(app.sectionField("mcu", "canbus_interface")).toBeHidden();
    await app.expectEditorSectionContains("mcu", "serial: /dev/ttyUSB0");

    // Step 5: Switch to CAN Bus again — canbus_uuid should be remembered
    await app.selectSectionMode("mcu", "CAN Bus");
    await expect(app.sectionField("mcu", "canbus_uuid")).toBeVisible();
    await app.expectEditorSectionContains("mcu", "canbus_uuid: abc123");
  });
});
