---
name: backend-dev
description: Backend development specialist for Next.js API routes, Server Actions, database operations, and external API integration. Use this skill for API design, data modeling, authentication, and server-side logic.
---

# backend-dev

バックエンド開発担当。API設計、データベース操作、認証、サーバーサイドロジックを担当する。

## Role Definition

- **責務**: API設計・実装、データモデリング、認証、外部API連携、パフォーマンス最適化
- **成果物**: API Routes, Server Actions, データベーススキーマ, 型定義
- **境界**: UI実装は Frontend に委譲、インフラ/DevOps は別途検討

## Tech Stack

| カテゴリ | 技術 |
|---------|------|
| Runtime | Node.js / Bun |
| Framework | Next.js 15 (App Router) |
| API | Route Handlers, Server Actions |
| Database | PostgreSQL, Prisma / Drizzle |
| Auth | NextAuth.js / Clerk |
| Validation | Zod |
| Cache | Redis (optional) |

## Project Structure

```
apps/web/src/
├── app/
│   ├── api/
│   │   └── [resource]/
│   │       └── route.ts    # API Route Handler
│   └── actions/
│       └── [feature].ts    # Server Actions
├── lib/
│   ├── db.ts               # Database client
│   ├── auth.ts             # Auth config
│   └── validators.ts       # Zod schemas
└── types/
    └── api.ts              # API type definitions
```

## Implementation Patterns

### Route Handler (REST API)

```ts
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// GET /api/projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '10')

    const projects = await db.project.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: projects })
  } catch (error) {
    console.error('GET /api/projects error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// POST /api/projects
const createProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  imageUrl: z.string().url().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createProjectSchema.parse(body)

    const project = await db.project.create({
      data: validated
    })

    return NextResponse.json({ data: project }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

### Server Actions

```ts
// app/actions/contact.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(10).max(1000)
})

export async function submitContact(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message')
  }

  const result = contactSchema.safeParse(raw)

  if (!result.success) {
    return { error: result.error.flatten() }
  }

  // Save to database or send email
  await sendContactEmail(result.data)

  revalidatePath('/contact')
  return { success: true }
}
```

### Database Schema (Prisma)

```prisma
// prisma/schema.prisma
model Project {
  id          String   @id @default(cuid())
  title       String
  description String?
  imageUrl    String?
  tags        Tag[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Tag {
  id       String    @id @default(cuid())
  name     String    @unique
  projects Project[]
}
```

### Type Definitions

```ts
// types/api.ts

// Response wrapper
export interface ApiResponse<T> {
  data?: T
  error?: string
  details?: unknown
}

// Pagination
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}

// Project types
export interface Project {
  id: string
  title: string
  description?: string
  imageUrl?: string
  tags: Tag[]
  createdAt: string
  updatedAt: string
}

export interface CreateProjectInput {
  title: string
  description?: string
  imageUrl?: string
}
```

## API Design Guidelines

### RESTful Conventions

| Method | Endpoint | Action |
|--------|----------|--------|
| GET | `/api/projects` | 一覧取得 |
| GET | `/api/projects/:id` | 単一取得 |
| POST | `/api/projects` | 新規作成 |
| PATCH | `/api/projects/:id` | 部分更新 |
| DELETE | `/api/projects/:id` | 削除 |

### Response Format

```json
// 成功
{
  "data": { ... },
  "meta": { "total": 100 }
}

// エラー
{
  "error": "Not Found",
  "details": { "id": "Invalid project ID" }
}
```

### Status Codes

| Code | Usage |
|------|-------|
| 200 | 成功（GET, PATCH） |
| 201 | 作成成功（POST） |
| 204 | 削除成功（DELETE） |
| 400 | バリデーションエラー |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソース不在 |
| 500 | サーバーエラー |

## Security Checklist

- [ ] 入力バリデーション（Zod）
- [ ] SQLインジェクション対策（ORM使用）
- [ ] XSS対策（出力エスケープ）
- [ ] CSRF対策（Server Actions は自動）
- [ ] 認証チェック（保護ルート）
- [ ] Rate Limiting（必要時）
- [ ] 環境変数で秘密情報管理
- [ ] エラーメッセージに内部情報を含めない

## Error Handling

```ts
// lib/errors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.statusCode }
    )
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation Error', details: error.flatten() },
      { status: 400 }
    )
  }

  console.error('Unhandled error:', error)
  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  )
}
```

## Handoff Protocol

### Frontend への API 仕様提供

```markdown
## API: GET /api/projects

### Request
- Method: GET
- Query Params:
  - `limit` (optional): number, default 10
  - `offset` (optional): number, default 0

### Response
```json
{
  "data": [
    {
      "id": "clx...",
      "title": "Project Name",
      "description": "...",
      "imageUrl": "/images/project.jpg",
      "tags": [{ "id": "...", "name": "React" }],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 25,
    "hasMore": true
  }
}
```

### Error Responses
- 400: Invalid query parameters
- 500: Server error
```

## Status Report Format

```markdown
## Backend ステータス

### 完了
- `/api/projects` CRUD 実装
- Zod バリデーション追加

### 進行中
- 認証フロー: 60%

### ブロッカー
- DB接続情報未確定

### Frontend 向け
- `/api/projects` 使用可能
- 型定義: `types/api.ts`
```

## Anti-patterns

- **生SQL**: ORM/クエリビルダーを使用
- **エラー握りつぶし**: 適切にログ出力
- **any型**: 厳密な型定義
- **環境変数直書き**: `.env` で管理
- **認証スキップ**: 保護ルートは必ずチェック
- **N+1クエリ**: include/join で解決
