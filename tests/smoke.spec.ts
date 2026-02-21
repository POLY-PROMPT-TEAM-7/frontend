import { expect, test } from "@playwright/test";

test("demo flow loads graph, shows details and study path, exports png", async ({ page }) => {
  await page.goto("/app");

  await page.getByTestId("load-demo-btn").click();
  await expect(page.getByTestId("graph-canvas")).toBeVisible();

  await page.getByTestId("search-input").fill("photosynthesis");
  await page.getByRole("button", { name: "Photosynthesis" }).click();

  await expect(page.getByTestId("details-panel")).toContainText("Photosynthesis");
  await expect(page.getByTestId("study-path-panel")).toContainText("Light Reactions");

  const exportButton = page.getByTestId("export-png-btn");
  await expect(exportButton).toBeEnabled({ timeout: 10000 });

  await exportButton.click();
  await expect(page.getByText("PNG export ready")).toBeVisible();
});

test("about page and landing route are available", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("landing-graph-preview")).toBeVisible();
  await page.getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByText("Responsible Use")).toBeVisible();
});
