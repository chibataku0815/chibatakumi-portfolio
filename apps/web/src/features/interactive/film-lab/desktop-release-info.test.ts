import { describe, expect, test } from "bun:test";
import {
  filmLabDesktopDownloadUrl,
  filmLabReadDesktopDownloadUrl,
  filmLabResolveDesktopDownloadArtifactName,
} from "./desktop-release-info";

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

describe("desktop-release-info download URL resolver", () => {
  test("環境変数が未設定なら現行公開 DMG URL を返す", () => {
    const originalPrivate = process.env.FILM_LAB_DESKTOP_DOWNLOAD_URL;
    const originalPublic = process.env.NEXT_PUBLIC_FILM_LAB_DESKTOP_DOWNLOAD_URL;
    delete process.env.FILM_LAB_DESKTOP_DOWNLOAD_URL;
    delete process.env.NEXT_PUBLIC_FILM_LAB_DESKTOP_DOWNLOAD_URL;

    try {
      expect(filmLabReadDesktopDownloadUrl()).toBe(filmLabDesktopDownloadUrl);
    } finally {
      if (originalPrivate === undefined) {
        delete process.env.FILM_LAB_DESKTOP_DOWNLOAD_URL;
      } else {
        process.env.FILM_LAB_DESKTOP_DOWNLOAD_URL = originalPrivate;
      }
      if (originalPublic === undefined) {
        delete process.env.NEXT_PUBLIC_FILM_LAB_DESKTOP_DOWNLOAD_URL;
      } else {
        process.env.NEXT_PUBLIC_FILM_LAB_DESKTOP_DOWNLOAD_URL = originalPublic;
      }
    }
  });

  test("環境変数があれば固定 URL より優先する", () => {
    const originalPrivate = process.env.FILM_LAB_DESKTOP_DOWNLOAD_URL;
    const originalPublic = process.env.NEXT_PUBLIC_FILM_LAB_DESKTOP_DOWNLOAD_URL;
    process.env.FILM_LAB_DESKTOP_DOWNLOAD_URL = "https://example.com/Filmtone-test.dmg";
    delete process.env.NEXT_PUBLIC_FILM_LAB_DESKTOP_DOWNLOAD_URL;

    try {
      expect(filmLabReadDesktopDownloadUrl()).toBe("https://example.com/Filmtone-test.dmg");
    } finally {
      if (originalPrivate === undefined) {
        delete process.env.FILM_LAB_DESKTOP_DOWNLOAD_URL;
      } else {
        process.env.FILM_LAB_DESKTOP_DOWNLOAD_URL = originalPrivate;
      }
      if (originalPublic === undefined) {
        delete process.env.NEXT_PUBLIC_FILM_LAB_DESKTOP_DOWNLOAD_URL;
      } else {
        process.env.NEXT_PUBLIC_FILM_LAB_DESKTOP_DOWNLOAD_URL = originalPublic;
      }
    }
  });
});
