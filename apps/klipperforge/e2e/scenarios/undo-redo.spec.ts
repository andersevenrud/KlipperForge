import { expect, test } from "../fixtures/app.fixture";

test.describe("Undo / redo", () => {
  test("undoes and redoes an [mcu] serial edit", async ({ app }) => {
    await app.goto();

    // Undo and Redo start disabled on a fresh document.
    const undo = app.page.getByRole("button", { name: "Undo" });
    const redo = app.page.getByRole("button", { name: "Redo" });
    await expect(undo).toBeDisabled();
    await expect(redo).toBeDisabled();

    // Expand [mcu] and set a serial value — one history entry after coalescing.
    await app.page.getByRole("button", { name: "[mcu]", exact: true }).click();
    await app.sectionFieldInput("mcu", "serial").fill("/dev/ttyUSB0");
    await app.expectEditorSectionContains("mcu", "serial: /dev/ttyUSB0");

    await expect(undo).toBeEnabled();
    await expect(redo).toBeDisabled();

    // Undo → editor no longer shows the serial line; redo re-enables.
    await undo.click();
    await expect(app.editorContent()).not.toContainText("serial: /dev/ttyUSB0", { timeout: 5_000 });
    await expect(undo).toBeDisabled();
    await expect(redo).toBeEnabled();

    // Redo → serial line comes back; history bookends flip.
    await redo.click();
    await app.expectEditorSectionContains("mcu", "serial: /dev/ttyUSB0");
    await expect(undo).toBeEnabled();
    await expect(redo).toBeDisabled();
  });
});
