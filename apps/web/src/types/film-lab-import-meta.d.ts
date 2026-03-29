/**
 * @file Film Lab 共有コンポーネントが `import.meta.env.BASE_URL` を参照するための型拡張。
 * @description Next.js の既定 `ImportMeta` には `env` が無い。Vite（Desktop レンダラ）では `BASE_URL` が `./` 等で入る。両方で同じソースを型チェックするために宣言を合わせる。
 * @limitations 他の `import.meta.env.*` はここでは宣言しない（必要になったら `ImportMetaEnv` に追加）。
 */
interface ImportMetaEnv {
  readonly BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
