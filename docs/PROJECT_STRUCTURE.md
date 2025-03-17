# プロジェクトディレクトリ構造

```markdown
.
├── apps/                          # アプリケーションディレクトリ
│   ├── docs/                      # ドキュメントアプリケーション
│   ├── nextjs-view-transitions/   # Next.jsビュートランジションアプリ
│   └── web/                       # メインのWebアプリケーション
│
├── packages/                      # 共有パッケージディレクトリ
│   ├── eslint-config/            # ESLint設定
│   ├── typescript-config/        # TypeScript設定
│   └── ui/                       # 共有UIコンポーネント
│
├── docs/                         # プロジェクトドキュメント
├── roo-docs/                     # 追加ドキュメント
│
├── .cursor/                      # Cursor IDE設定
├── .git/                         # Gitリポジトリ
├── .specstory/                   # 仕様ストーリー
├── .turbo/                       # Turboレポキャッシュ
│
├── bun.lock                      # Bunパッケージロックファイル
├── package.json                  # プロジェクト設定
├── tsconfig.json                 # TypeScript設定
├── turbo.json                    # Turboレポ設定
├── .gitignore                    # Git除外設定
├── .npmrc                        # npm設定
└── README.md                     # プロジェクト説明
```

## 主要ディレクトリの説明

### apps/
- アプリケーションのメインコードを含むディレクトリ
- 複数のアプリケーションをモノレポで管理
- `web/`: メインのWebアプリケーション
- `docs/`: ドキュメントアプリケーション
- `nextjs-view-transitions/`: ビュートランジション機能を持つNext.jsアプリ

### packages/
- 複数のアプリケーションで共有されるコードを含むディレクトリ
- `ui/`: 共有UIコンポーネントライブラリ
- `typescript-config/`: 共有TypeScript設定
- `eslint-config/`: 共有ESLint設定

### その他の重要なディレクトリ
- `docs/`: プロジェクト全体のドキュメント
- `.cursor/`: Cursor IDE固有の設定
- `.turbo/`: Turboレポのビルドキャッシュ
- `.specstory/`: プロジェクトの仕様に関する情報

## プロジェクト構成の特徴

このプロジェクトは以下の特徴を持つモノレポ構成となっています：

1. **Turboレポによるモノレポ管理**
   - 複数のアプリケーションとパッケージを効率的に管理
   - ビルドの最適化とキャッシュの活用

2. **パッケージマネージャー**
   - Bunを採用し、高速な依存関係の解決を実現
   - `bun.lock`ファイルによる依存関係の厳密な管理

3. **共有設定の集中管理**
   - TypeScriptとESLintの設定を`packages/`で一元管理
   - プロジェクト全体で一貫した開発環境を維持

4. **ドキュメント管理**
   - 複数のドキュメントディレクトリによる体系的な情報管理
   - アプリケーション固有のドキュメントと全体のドキュメントを分離 