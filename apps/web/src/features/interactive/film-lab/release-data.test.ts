import { describe, expect, test } from "bun:test";
import { releaseRails } from "./release-data";

describe("Filmtone public release rails", () => {
  test("Desktop public rail starts at the latest signed DMG", () => {
    expect(releaseRails.desktop[0]?.version).toBe("1.8");
  });

  test("iPhone public rail starts at the latest App Store release and excludes local candidates", () => {
    expect(releaseRails.ios[0]?.version).toBe("1.8");
    expect(releaseRails.ios.map((release) => release.version)).not.toContain("1.3");
  });
});
