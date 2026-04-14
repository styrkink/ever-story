# Antigravity Rules — AI-платформа персонализированных детских сказок

> Этот файл содержит глобальные правила проекта для AI-ассистента.
> Применяются ко всем файлам и задачам в репозитории.

---

## 🏗️ АРХИТЕКТУРА

### Общая структура

```
apps/
  web/          → Next.js 14 (App Router, web-first MVP)
  api/          → Fastify + Node.js 22 LTS (BFF + REST)
packages/
  shared/       → Общие TypeScript типы и схемы Zod
  ai-pipeline/  → Модули генерации (text, image, audio, assembly)
  db/           → Prisma-схема + миграции + pgvector helpers
  queue/        → BullMQ-воркеры и определения задач
infra/
  terraform/    → Вся инфраструктура как код (AWS)
  k8s/          → Helm charts для деплоя
```

### Обязательные паттерны

- **Monorepo** через `pnpm workspaces` + `turborepo`.
- **Event-Driven генерация**: никогда не вызывай AI-сервисы синхронно из HTTP-хендлеров. Все тяжёлые задачи — только через BullMQ.
- **BFF-паттерн**: фронтенд никогда не обращается напрямую к AI-сервисам. Только через `/api`.
- **Stateless API**: API-серверы не хранят состояние. Всё состояние — в Redis или PostgreSQL.

---

## 💻 FRONTEND (Next.js 14)

### Правила

- Используй **App Router** (`app/` директория). Pages Router запрещён.
- **Server Components** по умолчанию. Client Components (`"use client"`) только там, где нужна интерактивность (аудиоплеер, свайпы, WebSocket).
- Все формы — через **React Hook Form + Zod**. Никакого неконтролируемого состояния форм.
- Глобальное состояние — только **Zustand**. Никаких Context для глобального стейта (только для темы/i18n).
- Серверные данные — через **TanStack Query**. Polling статуса генерации — `useQuery` с `refetchInterval`.
- Стили — только **Tailwind CSS**. Никаких inline-стилей и CSS-модулей (кроме `globals.css`).
- Компоненты из **shadcn/ui** предпочтительнее кастомных.
- Анимации — **Framer Motion**. Не используй CSS-анимации для сложных переходов.
- Каждый маршрут должен иметь `loading.tsx` и `error.tsx`.
- **Обязательный** `metadata` объект в каждом `page.tsx`.
- Изображения — только через `next/image` с явными `width`/`height` или `fill`.

### Запрещено

- `useEffect` для fetch данных. Только Server Components или TanStack Query.
- `any` тип в TypeScript.
- Прямые `fetch` к OpenAI/FLUX/ElevenLabs из фронтенда.
- Хранение API-ключей в клиентском коде (даже в `NEXT_PUBLIC_*`).

### Структура папок (web)

```
app/
  (auth)/         → Страницы регистрации/входа
  (app)/          → Защищённые страницы приложения
    dashboard/
    stories/
    children/
    settings/
  (public)/       → Landing page, share-страницы
components/
  ui/             → shadcn/ui компоненты
  story/          → StoryViewer, FlipBook, AudioPlayer
  children/       → ChildProfile, PhotoUpload
  generation/     → GenerationProgress, StylePicker
hooks/            → useStoryGeneration, useChildProfile
lib/              → API клиент, утилиты
stores/           → Zustand stores
```

---

## ⚙️ BACKEND (Fastify)

### Правила

- Все роуты регистрируются как **Fastify plugins** (`fastify.register()`).
- Валидация входящих данных — **Zod** (через `fastify-type-provider-zod`). Не используй JSON Schema напрямую.
- Аутентификация — **JWT middleware** на уровне plugin. Роуты помечаются `{ onRequest: [authenticate] }`.
- Все ошибки — через кастомный `errorHandler`. Никаких `throw new Error()` без кастомного класса.
- Логирование — **Pino**. `request.log.info()` внутри хендлеров.
- Rate limiting — **@fastify/rate-limit** на роутах генерации.
- CORS — строгий allowlist. Никаких `origin: '*'` в продакшне.

### Структура (api)

```
src/
  plugins/
    auth.ts          → JWT + COPPA middleware
    db.ts            → Prisma client
    redis.ts         → Redis + BullMQ
    rateLimit.ts
  routes/
    auth/
    children/
    stories/
    subscriptions/
    webhooks/
  workers/
    text.worker.ts
    image.worker.ts
    audio.worker.ts
    assembly.worker.ts
  services/
    openai.service.ts
    flux.service.ts
    tts.service.ts
    face.service.ts
    safety.service.ts
  schemas/           → Zod схемы (shared с packages/shared)
  errors/            → Кастомные классы ошибок
```

---

## 🗄️ БАЗА ДАННЫХ

### Правила

- Используй **Prisma** как ORM. Никаких raw SQL кроме сложных pgvector-запросов.
- Все изменения схемы — только через миграции (`prisma migrate dev`). Никогда `prisma db push` в продакшне.
- **pgvector**: `embedding` поле в таблице `children` типа `Unsupported("vector(512)")`. Raw SQL через `prisma.$queryRaw`.
- Все удаления — **каскадные** на уровне БД (`onDelete: Cascade`).
- Обязательные индексы: `user_id` на всех дочерних таблицах, `status` + `created_at` на `stories`.
- **Транзакции** для операций, затрагивающих > 1 таблицы.
- Никогда не храни: пароли (только bcrypt hash), API ключи, исходные фото детей, данные карт.

### Соглашения по именованию

- Таблицы: `snake_case`, множественное число (`users`, `children`, `stories`).
- Поля: `snake_case` в БД, `camelCase` в Prisma-клиенте.
- Индексы: `idx_{table}_{field(s)}`.
- Внешние ключи: `{table}_id`.

---

## 🤖 AI ПАЙПЛАЙН

### Правила генерации

- **Никогда** не вызывай OpenAI/FLUX синхронно в HTTP-запросе.
- Каждый этап пайплайна — отдельный BullMQ worker с retry-логикой.
- Retry стратегия: `attempts: 3`, `backoff: { type: 'exponential', delay: 2000 }`.
- Dead-letter queue для задач с > 3 попытками. Уведомление команды через алёрт.
- **Content Safety** — обязательный вызов на входе (перед постановкой в очередь) и на выходе (после генерации текста и изображений).
- Все промпты — в отдельных `.prompt.ts` файлах с версионированием.
- Логируй `input_tokens`, `output_tokens`, `cost_estimate` каждого вызова OpenAI.

### Безопасность AI

- Системный промпт GPT-4o-mini всегда содержит блок `SAFETY_RULES` (импортируется из константы).
- После генерации текста — повторный вызов `openai.moderations.create()`.
- После генерации изображения — NSFW classifier. Результат логируется.
- При срабатывании фильтра: регенерация с усиленным safe-промптом (max 2 попытки), затем fallback на generic-героя.

### FLUX / Image Workers

- Воркеры запускаются на **RunPod spot instances** через KEDA auto-scaling.
- Формат изображений: WEBP, 1024x1024, lossy 85%.
- Обязательный Face Enhancement (GFPGAN) на каждом изображении с лицом.
- IP-Adapter weight: 0.7. Style LoRA weight: 0.8.

---

## 🔐 БЕЗОПАСНОСТЬ И COPPA

### Обязательные правила (нарушение = stop-ship)

- **VPC (Verifiable Parental Consent)**: загрузка фото ребёнка невозможна без `coppa_verified_at` в `users`.
- **Zero-store фото**: исходное фото НИКОГДА не сохраняется на диск/S3. Только float32-вектор AES-256.
- **EXIF-strip**: перед обработкой фото — удаление всех метаданных через `sharp`.
- **Право на забвение**: `DELETE /api/children/:id` удаляет каскадно ВСЕ данные за < 5 секунд.
- **JWT blocklist**: при выходе/смене пароля — токен попадает в Redis blocklist (TTL = оставшееся время жизни).
- **GDPR**: европейские пользователи (`locale` → EU) → данные только в `eu-central-1`.

### Шифрование

- Данные в покое: AWS RDS Encryption + S3 SSE-S3 (AES-256).
- Данные в передаче: TLS 1.3 везде. HSTS обязателен.
- Секреты: только AWS Secrets Manager. Запрещено: `.env` в git, `process.env` без валидации схемой.

### Валидация секретов при старте

```typescript
// Обязательно в каждом сервисе при старте
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  // ...
});

export const env = envSchema.parse(process.env);
```

---

## 💳 МОНЕТИЗАЦИЯ (Stripe)

### Правила

- Никаких карточных данных в нашей БД. Всё — через Stripe.
- Webhooks верифицируются через `stripe.webhooks.constructEvent()` с `STRIPE_WEBHOOK_SECRET`.
- Подписка обновляется только через Stripe webhook (`customer.subscription.updated`), не через клиент.
- Лимиты историй проверяются в middleware перед постановкой в очередь генерации.
- При достижении лимита — HTTP 402 с описанием тарифного плана.

### Тарифные лимиты (централизованно в константах)

```typescript
export const PLAN_LIMITS = {
  free:    { stories: 3,  children: 1, hasPdf: false, hasPhoto: false },
  basic:   { stories: 15, children: 2, hasPdf: true,  hasPhoto: true  },
  premium: { stories: -1, children: 5, hasPdf: true,  hasPhoto: true  },
} as const;
```

---

## 🧪 ТЕСТИРОВАНИЕ

### Обязательные покрытия

- **Unit тесты (Vitest)**: все сервисы, все Zod-схемы, все воркеры. Coverage ≥ 80%.
- **E2E тесты (Playwright)**: все UC из PRD Section 3. Запускаются на каждом PR.
- **Load тесты (k6)**: сценарий "100 VU × 30 мин" перед каждым релизом.
- **Safety тест-сьют**: 50 запрещённых промптов должны блокироваться на L1. Автозапуск в CI.

### Конвенции тестов

- Файлы тестов рядом с тестируемым файлом: `service.ts` → `service.test.ts`.
- E2E тесты в `e2e/` директории.
- Мок OpenAI через `vi.mock()` с предсказуемым ответом. Никаких реальных вызовов в тестах.
- Тест БД — через in-memory PostgreSQL (`pg-mem`) или тестовую БД с транзакционным rollback.

---

## 📦 КОД-СТИЛЬ И КОНВЕНЦИИ

### TypeScript

- `strict: true` везде. Никаких `any`, `!` (non-null assertion) без комментария-обоснования.
- Предпочитай `type` перед `interface` для data-типов. `interface` — для расширяемых контрактов.
- Экспортируй типы из `packages/shared`. Не дублируй типы между `web` и `api`.
- Все async-функции должны обрабатывать ошибки (try/catch или `.catch()`). Unhandled rejection запрещены.

### Именование

- Компоненты React: `PascalCase`.
- Хуки: `useCamelCase`.
- Сервисы: `camelCaseService` или класс `CamelCaseService`.
- Константы: `UPPER_SNAKE_CASE`.
- Файлы: `kebab-case.ts` (кроме React-компонентов — `PascalCase.tsx`).
- Env-переменные: `UPPER_SNAKE_CASE`.

### Git

- Ветки: `feat/`, `fix/`, `chore/`, `refactor/`.
- Коммиты: [Conventional Commits](https://conventionalcommits.org). Пример: `feat(stories): add PDF export endpoint`.
- PR не мерджится без: зелёных тестов, approval от 1 ревьювера, линтера без ошибок.

### Линтер / Форматтер

- **ESLint** + `@typescript-eslint` + `eslint-plugin-react-hooks`.
- **Prettier** с настройками: `semi: true`, `singleQuote: true`, `printWidth: 100`.
- Husky pre-commit: lint-staged на изменённых файлах.

---

## 📊 МОНИТОРИНГ И ЛОГИРОВАНИЕ

### Правила логирования

- Уровни: `error` (исключения), `warn` (деградация), `info` (бизнес-события), `debug` (только в dev).
- Обязательные поля в каждом логе: `service`, `user_id` (если есть), `trace_id`.
- **Запрещено** логировать: пароли, JWT-токены, embeddings, данные карт, полный текст промптов с PII.
- Все AI-вызовы логируют: `model`, `tokens_used`, `cost_usd`, `latency_ms`, `status`.

### Алёрты (PagerDuty)

- API Error Rate > 2% за 5 мин.
- Generation Success Rate < 95% за 1 час.
- GPU Queue Depth > 30 задач.
- P95 Generation Time > 240 сек.
- Любое нарушение COPPA (отсутствие VPC перед загрузкой фото).

---

## 🚫 ГЛОБАЛЬНЫЕ ЗАПРЕТЫ

Следующее **запрещено** в любом файле проекта:

1. Хранение исходных фотографий детей в S3 или БД.
2. Прямые вызовы AI-API из HTTP-роутов (минуя очередь).
3. Секреты/ключи в коде или git-репозитории.
4. `console.log` в продакшн-коде (только `pino` logger).
5. Отключение COPPA VPC проверки в любом окружении.
6. Генерация контента без прохождения Content Safety L1.
7. `SELECT *` в SQL-запросах (всегда явный список полей).
8. Синхронная генерация PDF > 1 страницы в основном потоке.
9. Хранение Stripe card данных в нашей БД.
10. Деплой без зелёных E2E тестов.
