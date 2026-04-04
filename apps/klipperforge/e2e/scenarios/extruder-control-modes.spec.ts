import { expect, test } from "../fixtures/app.fixture";

test.describe("Extruder control mode switching", () => {
  test("switching between pid and watermark shows correct fields and preserves values", async ({ app }) => {
    await app.goto();

    // The default config includes an extruder with control: pid and pid values.
    // Expand the extruder section in the sidebar to access its form.
    await app.page.getByRole("button", { name: "[extruder]" }).click();

    // Initial state: control is "pid" — pid fields visible, watermark fields hidden
    await expect(app.sectionField("extruder", "pid_kp")).toBeVisible();
    await expect(app.sectionField("extruder", "pid_ki")).toBeVisible();
    await expect(app.sectionField("extruder", "pid_kd")).toBeVisible();
    await expect(app.sectionField("extruder", "max_delta")).toBeHidden();

    // Step 1: Fill in custom pid values
    await app.sectionField("extruder", "pid_kp").fill("1");
    await app.sectionField("extruder", "pid_ki").fill("2");
    await app.sectionField("extruder", "pid_kd").fill("3");

    // Verify extruder has our pid values in the editor
    await app.expectEditorSectionContains("extruder", "pid_kp: 1");
    await app.expectEditorSectionContains("extruder", "pid_ki: 2");
    await app.expectEditorSectionContains("extruder", "pid_kd: 3");

    // Step 2: Switch to "watermark" — watermark fields visible, pid fields hidden
    await app.selectFieldOption("extruder", "control", "watermark");
    await expect(app.sectionField("extruder", "max_delta")).toBeVisible();
    await expect(app.sectionField("extruder", "pid_kp")).toBeHidden();
    await expect(app.sectionField("extruder", "pid_ki")).toBeHidden();
    await expect(app.sectionField("extruder", "pid_kd")).toBeHidden();
    await app.expectEditorSectionContains("extruder", "control: watermark");

    // Step 3: Fill in the watermark value
    await app.sectionField("extruder", "max_delta").fill("123");
    await app.expectEditorSectionContains("extruder", "max_delta: 123");

    // Step 4: Switch back to pid — pid values should be remembered, visibility correct
    await app.selectFieldOption("extruder", "control", "pid");
    await expect(app.sectionField("extruder", "pid_kp")).toBeVisible();
    await expect(app.sectionField("extruder", "pid_ki")).toBeVisible();
    await expect(app.sectionField("extruder", "pid_kd")).toBeVisible();
    await expect(app.sectionField("extruder", "max_delta")).toBeHidden();
    await app.expectEditorSectionContains("extruder", "pid_kp: 1");
    await app.expectEditorSectionContains("extruder", "pid_ki: 2");
    await app.expectEditorSectionContains("extruder", "pid_kd: 3");

    // Step 5: Switch back to watermark — watermark value should be remembered
    await app.selectFieldOption("extruder", "control", "watermark");
    await expect(app.sectionField("extruder", "max_delta")).toBeVisible();
    await expect(app.sectionField("extruder", "pid_kp")).toBeHidden();
    await app.expectEditorSectionContains("extruder", "max_delta: 123");

    // Step 6: Erase the watermark value
    await app.sectionField("extruder", "max_delta").clear();

    // The extruder should show control: watermark but no max_delta
    const editor = app.editorContent();
    await expect(editor).not.toContainText("max_delta:", { timeout: 5_000 });

    // Step 7: Switch to pid and back to watermark — watermark should still be cleared
    await app.selectFieldOption("extruder", "control", "pid");
    await app.selectFieldOption("extruder", "control", "watermark");
    await expect(app.sectionField("extruder", "max_delta")).toBeVisible();
    await expect(app.sectionField("extruder", "pid_kp")).toBeHidden();
    await expect(editor).not.toContainText("max_delta:", { timeout: 5_000 });

    // Step 8: Reset to "None" then back to pid — visibility should re-engage
    await app.selectFieldOption("extruder", "control", "None");
    await expect(app.sectionField("extruder", "pid_kp")).toBeVisible();
    await expect(app.sectionField("extruder", "max_delta")).toBeVisible();
    await app.selectFieldOption("extruder", "control", "pid");
    await expect(app.sectionField("extruder", "pid_kp")).toBeVisible();
    await expect(app.sectionField("extruder", "max_delta")).toBeHidden();
  });
});
