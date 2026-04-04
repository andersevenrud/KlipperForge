import { expect, test } from "../fixtures/app.fixture";

test.describe("Section management", () => {
  test("adding a fixed-name section updates the config", async ({ app }) => {
    await app.goto();

    const addButton = app.page.locator('[data-slot="dropdown-menu-trigger"]', { hasText: "Add" });
    await addButton.click();

    const searchInput = app.page.getByPlaceholder("Search sections...");
    await searchInput.fill("bltouch");

    await app.page.getByRole("menuitem", { name: "BLTouch" }).click();

    await expect(app.page.locator('[data-section-header="bltouch"]')).toBeVisible();

    await app.expectEditorContains("[bltouch]");
  });

  test("adding a named section shows the name dialog", async ({ app }) => {
    await app.goto();

    const addButton = app.page.locator('[data-slot="dropdown-menu-trigger"]', { hasText: "Add" });
    await addButton.click();

    const searchInput = app.page.getByPlaceholder("Search sections...");
    await searchInput.fill("stepper");

    await app.page.getByRole("menuitem", { name: "Stepper", exact: true }).click();

    const dialog = app.page.getByRole("dialog");
    await expect(dialog).toBeVisible();
  });

  test("search filters the section catalog", async ({ app }) => {
    await app.goto();

    const addButton = app.page.locator('[data-slot="dropdown-menu-trigger"]', { hasText: "Add" });
    await addButton.click();

    const searchInput = app.page.getByPlaceholder("Search sections...");
    await searchInput.fill("zzz_nonexistent_zzz");

    await expect(app.page.getByText("No sections found")).toBeVisible();
  });
});
