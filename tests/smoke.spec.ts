import { expect, test } from "@playwright/test";

test("demo flow loads graph, shows details and study path as floating cards, exports png", async ({ page }) => {
  await page.goto("/app");

  await page.getByTestId("load-demo-btn").click();
  await expect(page.getByTestId("graph-canvas")).toBeVisible();

  // Verify no right rail exists (details and study path moved to floating overlay)
  const detailsPanel = page.getByTestId("details-panel");
  const studyPathPanel = page.getByTestId("study-path-panel");
  await expect(detailsPanel).not.toBeVisible();
  await expect(studyPathPanel).not.toBeVisible();

  // Search and select a node to trigger floating cards
  await page.getByTestId("search-input").fill("photosynthesis");
  await page.getByRole("button", { name: "Photosynthesis" }).click();

  // Verify floating cards appear inside graph canvas
  const graphCanvas = page.getByTestId("graph-canvas");
  await expect(graphCanvas.getByTestId("details-panel")).toContainText("Photosynthesis");
  await expect(graphCanvas.getByTestId("study-path-panel")).toContainText("Light Reactions");

  // Verify close button exists in floating overlay
  await expect(page.getByTestId("close-details-btn")).toBeVisible();

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

test("home page does not overflow horizontally", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 1;
  });

  expect(hasHorizontalOverflow).toBeFalsy();
});

test("mobile layout stays within viewport and core controls remain visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app");

  await expect(page.getByTestId("load-demo-btn")).toBeVisible();
  await expect(page.getByTestId("search-input")).toBeVisible();
  await expect(page.getByTestId("upload-dropzone")).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 1;
  });

  expect(hasHorizontalOverflow).toBeFalsy();
});
