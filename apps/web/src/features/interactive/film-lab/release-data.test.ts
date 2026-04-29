import { describe, expect, test } from "bun:test";
import { releaseRails } from "./release-data";

describe("Filmtone public release rails", () => {
  test("Desktop public rail starts at v1.0.3", () => {
    expect(releaseRails.desktop[0]?.version).toBe("1.0.3");
  });

  test("iPhone public rail starts at v1.1 and excludes local candidates", () => {
    expect(releaseRails.ios[0]?.version).toBe("1.1");
    expect(releaseRails.ios.map((release) => release.version)).not.toContain("1.2");
  });
});
