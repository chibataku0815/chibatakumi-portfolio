# Skills表示順序変更タスク

## タスク概要

**開始:** 2025-12-10T00:51:33+0900 (Asia/Tokyo)
**ステータス:** 進行中

### 目的
Skillsページのスキル表示順序を以下の順番に変更し、「コーヒー」スキルを新規追加する。

### 希望する順序
1. 開発（Code & Interaction Systems）
2. デザイン（Identity & Systems）
3. 写真関係（Visual & Photo Direction）
4. 映像関係（Motion & Sound Layering）
5. コーヒー（新規追加）

### 現在の順序
1. Visual & Photo Direction (id: "01") - 写真
2. Code & Interaction Systems (id: "02") - 開発
3. Motion & Sound Layering (id: "03") - 映像
4. Identity & Systems (id: "04") - デザイン

---

## 影響範囲

### 対象ファイル
- `apps/web/src/shared/data/portfolio.ts`
  - `multiskillItems` 配列の順序変更
  - コーヒースキルの新規追加

### 影響するページ
- `/skills` - スキル一覧ページ
- `/` (index) - worksセクション（同じデータを使用）

---

## 技術詳細

### データ構造
```typescript
const multiskillItems: WorkItem[] = [
  // 配列の順序がそのまま表示順序になる
];
```

### 表示パターン（index % 3）
- index 0: パターンA（右重心）
- index 1: パターンB（左重心）
- index 2: パターンC（中央緊張）

### 新しい順序での構図
1. 開発 → index 0 → パターンA
2. デザイン → index 1 → パターンB
3. 写真 → index 2 → パターンC
4. 映像 → index 3 → パターンA
5. コーヒー → index 4 → パターンB

---

## 成果物

### ドキュメント
- [x] `.claude/tasks/2025-12-10-skills-reorder-task.md` - 本タスクドキュメント
- [ ] `.claude/prompts/2025-12-10-skills-reorder.md` - 実装プロンプト

### 実装
- [ ] `portfolio.ts` の `multiskillItems` 順序変更
- [ ] コーヒースキル新規追加

---

## 注意事項

- **コミット禁止**: 実装完了後も自動コミットは行わない
- **ビルド/リンター確認不要**: 指示されていないため省略
- IDは識別子として維持し、順序変更のために変更しない

---

最終更新: 2025-12-10T00:51:33+0900
