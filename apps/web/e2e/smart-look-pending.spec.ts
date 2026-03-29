import { test, expect } from "@playwright/test";

/**
 * Smart Look UI が pending 中は `/film-lab` に出ないことを確認する。
 * @description 現在の `.env.local` / build-time env をそのまま使う smoke test。
 */
test.describe("Film Lab smart look pending", () => {
  test("does not render smart-look controls while the UI flag is off", async ({ page }) => {
    await page.goto("/film-lab", { waitUntil: "load" });
    await expect(page.getByTestId("film-lab-open")).toBeVisible({ timeout: 90_000 });

    await expect(
      page.getByText("見本に色味を合わせる（AI・beta）", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Match colors to a sample (AI, beta)", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /見本の写真を選ぶ|Pick sample photo/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /見本に合わせる|Match sample look/ }),
    ).toHaveCount(0);
  });
});
