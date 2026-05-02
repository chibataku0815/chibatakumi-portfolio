import { describe, expect, test } from "bun:test";
import { releaseRails } from "./release-data";

describe("Filmtone public release rails", () => {
  test("Desktop public rail starts at v1.0.4", () => {
    expect(releaseRails.desktop[0]?.version).toBe("1.0.4");
  });

  test("iPhone public rail starts at v1.2 and excludes local candidates", () => {
    expect(releaseRails.ios[0]?.version).toBe("1.2");
    expect(releaseRails.ios.map((release) => release.version)).not.toContain("1.3");
  });
});
