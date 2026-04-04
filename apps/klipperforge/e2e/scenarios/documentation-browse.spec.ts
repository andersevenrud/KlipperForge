import { expect, test } from "../fixtures/app.fixture";

test.describe("Documentation browsing", () => {
  test("navigating to documentation tab shows the sidebar", async ({ app }) => {
    await app.goto();

    await app.navigateToTab("Documentation");

    await expect(app.page).toHaveURL(/\/documentation/);
    await expect(app.page.getByText("MCU Boards")).toBeVisible();
  });

  test("clicking a sidebar category and item shows details", async ({ app }) => {
    await app.goto("/documentation");

    // Expand the MCU Boards category
    const mcuBoards = app.page.getByRole("button", { name: /MCU Boards/ }).first();
    await mcuBoards.click();

    // Wait for sub-groups to appear, then expand the first one
    const firstSubGroup = app.page
      .locator("[data-state=closed]")
      .filter({ has: app.page.getByRole("button") })
      .first();
    await firstSubGroup.getByRole("button").first().click();

    // Click the first board item
    const firstItem = app.page.locator("[data-item-id]").first();
    await firstItem.waitFor({ state: "visible" });
    await firstItem.click();

    // Assert the detail panel shows content
    await expect(app.page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("navigating between tabs preserves state", async ({ app }) => {
    await app.goto();
    await app.openNewConfigDialog();

    await app.selectFromRadixSelect("vendor-select", "Creality");
    await app.selectFromRadixSelect("model-select", "Ender 3");
    await app.page.getByRole("button", { name: "Create" }).click();
    await app.expectEditorContains("[printer]");

    await app.navigateToTab("Documentation");
    await expect(app.page).toHaveURL(/\/documentation/);

    await app.navigateToTab("Configuration");
    await expect(app.page).toHaveURL(/^http:\/\/localhost:\d+\/$/);

    await app.expectEditorContains("[printer]");
    await app.expectEditorContains("kinematics: cartesian");
  });
});
