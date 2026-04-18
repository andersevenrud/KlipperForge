import { expect, test } from "../fixtures/app.fixture";

test.describe("Draft restoration on reload", () => {
  test("preserves unsaved edits across reload without ?config=", async ({ app }) => {
    await app.goto();

    await expect(app.page).toHaveURL(/^http:\/\/localhost:\d+\/$/);

    await app.page.getByRole("button", { name: "[mcu]", exact: true }).click();
    await app.sectionFieldInput("mcu", "serial").fill("/dev/ttyUSB9");
    await app.expectEditorSectionContains("mcu", "serial: /dev/ttyUSB9");
    await expect(app.page.getByText("You have unsaved changes in this draft.")).toBeVisible();

    await app.page.reload();
    await app.page.waitForLoadState("networkidle");

    // URL remained parameter-free.
    await expect(app.page).toHaveURL(/^http:\/\/localhost:\d+\/$/);

    await app.page.getByRole("button", { name: "[mcu]", exact: true }).click();
    await expect(app.sectionFieldInput("mcu", "serial")).toHaveValue("/dev/ttyUSB9");
    await app.expectEditorSectionContains("mcu", "serial: /dev/ttyUSB9");
    await expect(app.page.getByText("You have unsaved changes in this draft.")).toBeVisible();
  });

  test("preserves unsaved edits across reload with ?config=<id>", async ({ app }) => {
    await app.goto();

    // Seed a saved config via Ender 3 preset + Save As. Save As enters the local
    // storage adapter, populates the URL with ?config=<id>, and clears dirty.
    await app.openNewConfigDialog();
    await app.selectFromRadixSelect("vendor-select", "Creality");
    await app.selectFromRadixSelect("model-select", "Ender 3");
    await app.page.getByRole("button", { name: "Create" }).click();

    await app.page.getByRole("button", { name: "Save As" }).click();
    await app.page.getByPlaceholder("My Printer Config").fill("E2E Restore Test");
    await app.page.getByRole("dialog", { name: "Save Config" }).getByRole("button", { name: "Save" }).click();

    await expect(app.page).toHaveURL(/\?config=/);
    await expect(app.page.getByText("You have unsaved changes in this draft.")).toBeHidden();

    // Edit [mcu] on top of the saved config — draft becomes dirty.
    await app.page.getByRole("button", { name: "[mcu]", exact: true }).click();
    await app.sectionFieldInput("mcu", "serial").fill("/dev/ttyUSB9");
    await app.expectEditorSectionContains("mcu", "serial: /dev/ttyUSB9");
    await expect(app.page.getByText("You have unsaved changes in this draft.")).toBeVisible();

    const urlBeforeReload = app.page.url();

    await app.page.reload();
    await app.page.waitForLoadState("networkidle");

    // ?config= survives, dirty edits survive, remote fetch does NOT clobber
    // the restored draft.
    expect(app.page.url()).toBe(urlBeforeReload);
    await app.page.getByRole("button", { name: "[mcu]", exact: true }).click();
    await expect(app.sectionFieldInput("mcu", "serial")).toHaveValue("/dev/ttyUSB9");
    await app.expectEditorSectionContains("mcu", "serial: /dev/ttyUSB9");
    await expect(app.page.getByText("You have unsaved changes in this draft.")).toBeVisible();
  });
});
