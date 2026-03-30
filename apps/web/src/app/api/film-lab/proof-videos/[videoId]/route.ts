/**
 * @file Film Lab LP の仮 proof 動画をローカルファイルから返す route です。
 * @description LP から直接ローカル絶対パスを見せないように、固定 ID で mp4 を配信します。
 * @limitations ローカル環境の暫定実装です。公開前には `public` 配下や正式な配信基盤へ置き換える前提です。
 */

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename } from "node:path";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { filmLabGetProofVideoDefinition } from "@/features/interactive/film-lab/film-lab-proof-videos";

export const runtime = "nodejs";

/**
 * @description range ヘッダーを読み取り、返す byte 範囲を決めます。
 * @param {string | null} rangeHeader - リクエストの `Range` ヘッダー。
 * @param {number} fileSize - 対象 mp4 の総 byte 数。
 * @returns {{ start: number; end: number; isPartial: boolean } | null} 正常なら返却範囲、解釈できなければ `null`。
 */
function filmLabParseVideoRange(
  rangeHeader: string | null,
  fileSize: number,
): { start: number; end: number; isPartial: boolean } | null {
  if (!rangeHeader) {
    return { start: 0, end: fileSize - 1, isPartial: false };
  }

  const rangeMatch = /^bytes=(\d*)-(\d*)$/u.exec(rangeHeader.trim());
  if (!rangeMatch) return null;

  const [, startRaw, endRaw] = rangeMatch;
  if (startRaw === "" && endRaw === "") return null;

  let start = 0;
  let end = fileSize - 1;

  if (startRaw === "") {
    const suffixLength = Number(endRaw);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(fileSize - suffixLength, 0);
  } else {
    start = Number(startRaw);
    end = endRaw === "" ? fileSize - 1 : Number(endRaw);
  }

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < 0 ||
    start > end ||
    start >= fileSize ||
    end >= fileSize
  ) {
    return null;
  }

  return { start, end, isPartial: true };
}

/**
 * @description 動画レスポンス共通ヘッダーを作ります。
 * @param {string} fileName - `Content-Disposition` 用のファイル名。
 * @param {number} fileSize - 対象ファイルの総 byte 数。
 * @param {number} start - 返却開始 byte。
 * @param {number} end - 返却終了 byte。
 * @param {boolean} isPartial - `206 Partial Content` かどうか。
 * @returns {Headers} 設定済みヘッダー。
 */
function filmLabBuildVideoHeaders(
  fileName: string,
  fileSize: number,
  start: number,
  end: number,
  isPartial: boolean,
): Headers {
  const headers = new Headers({
    "accept-ranges": "bytes",
    "cache-control": "no-store",
    "content-disposition": `inline; filename="${fileName}"`,
    "content-length": String(end - start + 1),
    "content-type": "video/mp4",
  });

  if (isPartial) {
    headers.set("content-range", `bytes ${start}-${end}/${fileSize}`);
  }

  return headers;
}

/**
 * @description proof 動画 ID を受け取り、対応するローカル mp4 を返します。
 * @param {NextRequest} request - ブラウザからの GET リクエスト。
 * @param {{ params: Promise<{ videoId: string }> }} context - 動的ルートの `videoId`。
 * @returns {Promise<Response>} mp4 ストリーム、またはエラーレスポンス。
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> },
): Promise<Response> {
  const { videoId } = await context.params;
  const videoDefinition = filmLabGetProofVideoDefinition(videoId);

  if (!videoDefinition) {
    return NextResponse.json({ ok: false as const, code: "unknown_video" }, { status: 404 });
  }

  let fileStats;
  try {
    fileStats = await stat(videoDefinition.sourcePath);
  } catch {
    return NextResponse.json({ ok: false as const, code: "missing_source_file" }, { status: 404 });
  }

  if (!fileStats.isFile() || fileStats.size <= 0) {
    return NextResponse.json({ ok: false as const, code: "invalid_source_file" }, { status: 404 });
  }

  const parsedRange = filmLabParseVideoRange(request.headers.get("range"), fileStats.size);
  if (!parsedRange) {
    return new NextResponse(null, {
      status: 416,
      headers: { "content-range": `bytes */${fileStats.size}` },
    });
  }

  const fileName = basename(videoDefinition.sourcePath);
  const nodeStream = createReadStream(videoDefinition.sourcePath, {
    start: parsedRange.start,
    end: parsedRange.end,
  });
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new Response(webStream, {
    status: parsedRange.isPartial ? 206 : 200,
    headers: filmLabBuildVideoHeaders(
      fileName,
      fileStats.size,
      parsedRange.start,
      parsedRange.end,
      parsedRange.isPartial,
    ),
  });
}
