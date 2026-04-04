import { expect, test } from "../fixtures/app.fixture";

test.describe("Configuration flow", () => {
  test("selecting a printer preset populates the config", async ({ app }) => {
    await app.goto();
    await app.openNewConfigDialog();

    await app.selectFromRadixSelect("vendor-select", "Creality");
    await app.selectFromRadixSelect("model-select", "Ender 3");
    await app.page.getByRole("button", { name: "Create" }).click();

    await app.expectEditorContains("[printer]");
    await app.expectEditorContains("kinematics: cartesian");
    await app.expectEditorContains("[stepper_x]");
    await app.expectEditorContains("[stepper_y]");
    await app.expectEditorContains("[stepper_z]");
  });

  test("changing manufacturer updates the config", async ({ app }) => {
    await app.goto();
    await app.openNewConfigDialog();

    await app.selectFromRadixSelect("vendor-select", "Creality");
    await app.selectFromRadixSelect("model-select", "Ender 3");
    await app.page.getByRole("button", { name: "Create" }).click();
    await app.expectEditorContains("kinematics: cartesian");

    await app.openNewConfigDialog();
    await app.selectFromRadixSelect("vendor-select", "VORON Design");
    await app.selectFromRadixSelect("model-select", "Voron 2.4");
    await app.page.getByRole("button", { name: "Create" }).click();

    await app.expectEditorContains("kinematics: corexy");
  });

  test("variant dropdown works for multi-variant printers", async ({ app }) => {
    await app.goto();
    await app.openNewConfigDialog();

    await app.selectFromRadixSelect("vendor-select", "VORON Design");
    await app.selectFromRadixSelect("model-select", "Voron 2.4");

    const variantTrigger = app.page.locator("#variant-select");
    await expect(variantTrigger).toBeEnabled();

    await app.selectFromRadixSelect("variant-select", "250mm");
    await app.page.getByRole("button", { name: "Create" }).click();
    await app.expectEditorContains("[printer]");
  });

  test("blank configuration creates minimal config", async ({ app }) => {
    await app.goto();
    await app.openNewConfigDialog();

    await app.page.getByRole("button", { name: "Blank Configuration" }).click();

    await app.expectEditorContains("[printer]");
    await app.expectEditorContains("[mcu]");
    // Should NOT have stepper/extruder sections from the default config
    const editor = app.editorContent();
    await expect(editor).not.toContainText("[stepper_x]");
    await expect(editor).not.toContainText("[extruder]");
  });
});
