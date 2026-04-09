import { test as base, expect, type Page } from "@playwright/test";

interface AppFixtures {
  app: AppHelper;
}

class AppHelper {
  constructor(readonly page: Page) {}

  async goto(path = "/") {
    await this.page.goto(path);
    await this.page.waitForLoadState("networkidle");
  }

  async navigateToTab(name: string) {
    await this.page.getByRole("tab", { name }).click();
  }

  async openNewConfigDialog() {
    await this.page.getByRole("button", { name: "New" }).click();
  }

  async selectFromRadixSelect(triggerId: string, optionText: string) {
    const trigger = this.page.locator(`#${triggerId}`);
    await trigger.click();
    await this.page.getByRole("option", { name: optionText, exact: true }).click();
  }

  sectionField(sectionHeader: string, fieldName: string) {
    return this.page.locator(`#${sectionHeader}-${fieldName}`);
  }

  async selectFieldOption(sectionHeader: string, fieldName: string, optionText: string) {
    const wrapper = this.page.locator(`[for="${sectionHeader}-${fieldName}"]`).locator("..");
    const combobox = wrapper.locator("..").getByRole("combobox");
    await combobox.click();
    await this.page.getByRole("option", { name: optionText, exact: true }).click();
  }

  async selectSectionMode(sectionHeader: string, optionText: string) {
    const header = this.page.locator(`[data-section-header="${sectionHeader}"]`);
    const section = header.locator("xpath=ancestor::*[@data-state]");
    const combobox = section.getByRole("combobox").first();
    await combobox.click();
    await this.page.getByRole("option", { name: optionText, exact: true }).click();
  }

  editorContent() {
    return this.page.locator(".cm-content");
  }

  async expectEditorContains(text: string) {
    await expect(this.editorContent()).toContainText(text, { timeout: 10_000 });
  }

  async expectEditorSectionContains(section: string, text: string) {
    const editor = this.editorContent();
    await expect(editor).toContainText(text, { timeout: 10_000 });
    await expect
      .poll(
        async () => {
          const content = (await editor.innerText()) ?? "";
          const lines = content.split("\n");
          const headerLine = lines.findIndex((l) => l.trim() === `[${section}]`);
          if (headerLine === -1) return false;
          const sectionLines: string[] = [];
          for (let i = headerLine + 1; i < lines.length; i++) {
            if (lines[i].trim().startsWith("[") && lines[i].trim().includes("]")) break;
            sectionLines.push(lines[i]);
          }
          return sectionLines.some((l) => l.includes(text));
        },
        { timeout: 10_000 },
      )
      .toBe(true);
  }
}

export const test = base.extend<AppFixtures>({
  app: async ({ page }, use) => {
    await use(new AppHelper(page));
  },
});

export { expect };
