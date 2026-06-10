// hop-2 gate: WGSL finish pipeline ≡ CPU oracle (see /dev/finish-parity harness and
// docs/journal/motion-demo-webgpu-finish-plan.md). Needs WebGPU in Chromium — run with:
//   bun run e2e:finish-parity
// If the headless GPU path is unavailable on this machine, re-run headed:
//   PWDEBUG=0 bunx playwright test e2e/finish-parity.spec.ts --headed
import { test, expect } from "@playwright/test";

test.use({
  launchOptions: {
    args: [
      "--enable-unsafe-webgpu",
      "--ignore-gpu-blocklist",
      "--enable-features=WebGPU",
    ],
  },
});

test("WGSL finish parity vs CPU oracle (hop-2 + falsification legs)", async ({ page }) => {
  // The CPU oracle runs ~6 full 640×640 frames in un-minified dev code; on a cold
  // turbopack compile the whole harness can take >2 min. Give it room.
  test.setTimeout(360_000);
  await page.goto("/dev/finish-parity");
  const pre = page.locator("[data-parity-status]");
  await expect(pre).toHaveAttribute("data-parity-status", "done", {
    timeout: 300_000,
  });
  const report = JSON.parse((await pre.innerText()) || "{}") as {
    webgpu?: boolean;
    overall?: string;
  };
  console.log(JSON.stringify(report, null, 2));
  expect(report.webgpu, "WebGPU must be available in the test browser").toBe(true);
  expect(report.overall).toBe("PASS");
});
