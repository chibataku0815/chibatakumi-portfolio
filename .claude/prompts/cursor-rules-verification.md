# Cursor ルール認識確認プロンプト

以下をCursorに貼り付けて、ルールが正しく認識されているか確認してください。

---

## 確認プロンプト

```
以下の項目について、現在認識しているルールを回答してください。

1. **プロジェクト概要**
   - 使用しているFrameworkは？
   - 使用しているStylingライブラリは？

2. **デザイン原則**
   - 背景色の指定は？
   - アクセントカラーは？

3. **コーディング規約**
   - JSDocの必須レベルは？
   - 命名規則（変数、関数）は？

4. **ワークフロー**
   - Sequential Thinkingは必須か？
   - Autonomyのルールは？

5. **並行作業**
   - タスク管理のSingle Source of Truthは？
   - 作業宣言はどこに記録する？

6. **サンプル実装**
   - アニメーション実装前に何を参照すべき？
   - Sample-First Workflowの手順は？

7. **参照ドキュメント**
   - グローバルルールはどのファイル？
   - ツール固有ルールはどのディレクトリ？

回答は箇条書きで簡潔に。
```

---

## 期待される回答

```
1. プロジェクト概要
   - Framework: Next.js 16 (App Router) + React 19
   - Styling: Tailwind CSS v4 + shadcn/ui

2. デザイン原則
   - 背景色: 漆黒 (#050505–#0a0a0a)
   - アクセント: Amber/Orange

3. コーディング規約
   - JSDoc: 小学生でもわかるレベル、全ファイル必須
   - 命名: lowerCamelCase

4. ワークフロー
   - Sequential Thinking: 必須 (MANDATORY)
   - Autonomy: 標準実装は確認不要で進める

5. 並行作業
   - Single Source of Truth: .claude/tasks/ACTIVE-PARALLEL-TASK.md
   - 作業宣言: 同上ファイルに記録

6. サンプル実装
   - 参照先: apps/exampleXX/
   - 手順: transcript.md → src/ → 実装前確認

7. 参照ドキュメント
   - グローバル: .ai/GLOBAL.md
   - Cursor固有: .cursor/rules/
```

---

## 問題がある場合

回答が期待と異なる場合:

1. **ファイルが読み込まれていない**
   - `.cursor/rules/` ディレクトリが存在するか確認
   - ファイル拡張子が `.mdc` か確認

2. **古いルールが残っている**
   - `.cursorrules` が削除されているか確認
   - Cursorを再起動

3. **globs パターンの問題**
   - 各 `.mdc` ファイルの `globs` 設定を確認
