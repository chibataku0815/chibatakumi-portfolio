import { describe, expect, test } from "bun:test";
import { filmLabResolveDesktopDownloadArtifactName } from "./desktop-release-info";

describe("desktop-release-info artifact name resolver", () => {
  test("通常の filmtone DMG URL から basename を返す", () => {
    expect(
      filmLabResolveDesktopDownloadArtifactName(
        "https://blob.vercel-storage.com/filmtone/releases/filmtone-1.0.1-arm64.dmg",
      ),
    ).toBe("filmtone-1.0.1-arm64.dmg");
  });

  test("query 付き URL でも basename を返す", () => {
    expect(
      filmLabResolveDesktopDownloadArtifactName(
        "https://blob.vercel-storage.com/filmtone/releases/filmtone-1.0.1-arm64.dmg?download=1&token=abc",
      ),
    ).toBe("filmtone-1.0.1-arm64.dmg");
  });

  test("basename が取れない URL は unknown を返す", () => {
    expect(
      filmLabResolveDesktopDownloadArtifactName(
        "https://blob.vercel-storage.com/filmtone/releases/",
      ),
    ).toBe("unknown");
  });

  test("空文字は unknown を返す", () => {
    expect(filmLabResolveDesktopDownloadArtifactName("")).toBe("unknown");
  });
});
