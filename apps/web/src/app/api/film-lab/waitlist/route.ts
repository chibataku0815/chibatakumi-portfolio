/**
 * @file POST /api/film-lab/waitlist — Wave 2 D5.2 alias shim.
 * @description Filmtone Signature Pack waitlist API は `/api/waitlist` に移管。
 *   この shim は旧 path を保持して、外部からのキャッシュ済みフェッチや link を
 *   silently 維持するためだけに存在する（plan §6.2）。新規呼び出し元は `/api/waitlist` を直接叩くこと。
 * @limitations 本体ロジックはすべて `../../waitlist/route.ts` に存在。`runtime` は Next.js の
 *   route segment config が re-export を解析できないため本ファイルでも明示的に宣言する
 *   （Next 16 Turbopack 制約: build error "Next.js can't recognize the exported `runtime` field
 *   in route. It mustn't be reexported."）。
 */

export { POST } from "../../waitlist/route";

export const runtime = "nodejs";
