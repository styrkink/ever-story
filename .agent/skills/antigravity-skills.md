# Antigravity Skills — AI-платформа персонализированных детских сказок

> Каждый skill — это специализированный модуль с инструкциями для AI-ассистента.
> Используй конкретный skill при работе с соответствующей частью системы.

---

## SKILL 01 — Auth & COPPA Verification

**Когда применять:** создание/изменение аутентификации, верификации родителя, JWT-логики.

### Контекст

Система должна соответствовать COPPA (США) и GDPR Art. 8 (EU). Загрузка фото ребёнка и создание профиля невозможны без прохождения VPC (Verifiable Parental Consent).

### Реализация JWT

```typescript
// Структура payload
interface JwtPayload {
  sub: string;           // user_id
  tier: 'free' | 'basic' | 'premium';
  coppaVerified: boolean;
  region: 'us' | 'eu';
  iat: number;
  exp: number;
}

// Access token TTL: 15 минут
// Refresh token TTL: 30 дней (в Redis с возможностью отзыва)
```

### COPPA VPC Flow

1. Пользователь регистрируется → флаг `coppa_verified_at = null`.
2. При попытке создать профиль ребёнка или загрузить фото — middleware проверяет `coppa_verified_at`.
3. Если null — редирект на `/verify-parent` с объяснением.
4. Верификация: транзакция на $0.01 через Stripe (возвращается) или карточная проверка.
5. После успеха — `coppa_verified_at = NOW()` в БД, обновление JWT.

### Middleware шаблон

```typescript
async function requireCoppa(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user; // из JWT
  if (!user.coppaVerified) {
    return reply.code(403).send({
      error: 'COPPA_VERIFICATION_REQUIRED',
      message: 'Parental verification required before accessing child data.',
      verifyUrl: '/verify-parent',
    });
  }
}
```

### Чеклист

- [ ] Google OAuth 2.0 + Apple Sign-In + Email/Password
- [ ] Email верификация при регистрации
- [ ] COPPA VPC middleware на всех `/children/*` роутах
- [ ] JWT blocklist в Redis при logout/password change
- [ ] Принудительный logout на всех устройствах при смене пароля
- [ ] GDPR: EU пользователи → данные в `eu-central-1`

---

## SKILL 02 — Child Profile & Photo Processing

**Когда применять:** создание/редактирование профиля ребёнка, загрузка и обработка фото.

### Правила обработки фото (КРИТИЧНО)

```
ИСХОДНОЕ ФОТО → sharp (EXIF strip) → InsightFace (face detection + quality check)
             → ArcFace (embedding extraction, dim=512) → AES-256 encrypt
             → pgvector store → ИСХОДНОЕ ФОТО УДАЛЯЕТСЯ ИЗ ПАМЯТИ
```

Исходный файл **никогда** не попадает на диск или в S3.

### Face Quality Validation

```typescript
interface FaceQualityResult {
  score: number;          // 0.0 - 1.0, требуется > 0.7
  issues: string[];       // ['blur', 'low_light', 'face_not_centered', 'multiple_faces']
  faceCount: number;
}

// При score < 0.7 — вернуть пользователю подсказку с примером хорошего фото
```

### Embedding Storage (pgvector)

```sql
-- Prisma не поддерживает vector нативно, используй raw SQL
INSERT INTO children (id, user_id, name, embedding_vector, ...)
VALUES ($1, $2, $3, $4::vector, ...);

-- При поиске похожих (для рекомендаций, не для идентификации)
SELECT id, name FROM children
WHERE user_id = $1
ORDER BY embedding_vector <-> $2::vector
LIMIT 5;
```

### Каскадное удаление (< 5 секунд)

```typescript
// При DELETE /api/children/:id
async function deleteChildProfile(childId: string, userId: string) {
  await prisma.$transaction([
    prisma.storyPage.deleteMany({ where: { story: { childId } } }),
    prisma.story.deleteMany({ where: { childId } }),
    prisma.child.delete({ where: { id: childId, userId } }),
  ]);
  // Удаление медиафайлов из S3 — асинхронно через BullMQ (не блокирует ответ)
  await cleanupQueue.add('delete-child-media', { childId });
}
```

### Чеклист

- [ ] sharp для EXIF-strip перед любой обработкой
- [ ] FaceQuality Score > 0.7 обязателен
- [ ] Embedding в pgvector (dim=512), не исходное изображение
- [ ] AES-256 шифрование embedding в БД
- [ ] Каскадное удаление всех данных при удалении профиля
- [ ] Лимит профилей по тарифу (free: 1, basic: 2, premium: 5)

---

## SKILL 03 — Story Generation Pipeline

**Когда применять:** реализация генерации историй, BullMQ воркеры, прогресс через WebSocket.

### Архитектура очереди

```
HTTP POST /api/stories/generate
    ↓
[L1 Content Safety Check] → 422 если unsafe
    ↓
[Rate Limit Check] → 429 если > 5 активных задач
    ↓
[Plan Limit Check] → 402 если исчерпан лимит
    ↓
BullMQ: story-text-queue (приоритет: premium > basic > free)
    ↓
TextWorker → story-image-queue (x10 параллельно) + story-audio-queue
    ↓
AssemblyWorker (ждёт все изображения и аудио)
    ↓
WebSocket event: story_ready
```

### BullMQ Job Definition

```typescript
interface StoryGenerationJob {
  jobId: string;
  storyId: string;
  userId: string;
  childId: string;
  theme: 'space' | 'magic' | 'dinosaurs';
  artStyle: '3d_cartoon' | 'watercolor' | 'classic';
  moral?: 'friendship' | 'courage' | 'kindness' | 'honesty' | 'none';
  ageGroup: '2-4' | '5-7' | '8-12';
  length: 'short' | 'standard' | 'long'; // 5 / 10 / 15 страниц
  childEmbedding?: Float32Array; // если есть фото
  customIdea?: string; // свободный ввод родителя
}
```

### WebSocket Progress Events

```typescript
type ProgressEvent =
  | { type: 'queued';      position: number }
  | { type: 'text_done';   preview: string }
  | { type: 'image_done';  page: number; total: number; url: string }
  | { type: 'audio_done' }
  | { type: 'assembly';    progress: number }
  | { type: 'story_ready'; storyId: string; manifestUrl: string }
  | { type: 'failed';      error: string; retryable: boolean };
```

### Text Generation Prompt Template

```typescript
const STORY_SYSTEM_PROMPT = `
You are a warm, creative children's story writer.
Create a ${length}-page story for a ${ageGroup} year old child.

HERO: ${childName}${pet ? `, their pet ${petName} (${petType})` : ''}
THEME: ${theme}
MORAL: ${moral !== 'none' ? moral : 'no specific moral, just fun'}
STYLE: Vocabulary appropriate for ${ageGroup} years old.

${SAFETY_RULES}  // импортируется из константы

Return ONLY valid JSON array of ${pageCount} objects:
[{
  "scene_number": 1,
  "text": "...",          // 2-4 sentences, age-appropriate
  "illustration_prompt": "...", // detailed visual description, NO child's real face description
  "mood": "exciting|calm|mysterious|triumphant|cozy"
}]
`;
```

### Чеклист

- [ ] L1 Safety Check перед добавлением в очередь
- [ ] Rate limiting: 5 активных задач на пользователя
- [ ] Plan limits middleware (PLAN_LIMITS константа)
- [ ] BullMQ retry: attempts 3, exponential backoff
- [ ] Dead-letter queue + алёрт при failure
- [ ] WebSocket прогресс на каждом этапе
- [ ] Параллельная генерация изображений (worker pool ≥ 5)
- [ ] Fallback GPT-4o при ошибке GPT-4o-mini

---

## SKILL 04 — Image Generation & Character Consistency

**Когда применять:** FLUX генерация, IP-Adapter, Face Enhancement.

### FLUX Pipeline (ComfyUI API)

```typescript
interface FluxGenerationParams {
  prompt: string;                    // из illustration_prompt
  negativePrompt: string;           // "blurry, deformed, ugly, nsfw, violence"
  artStyle: ArtStyle;               // применяется style LoRA
  faceEmbedding?: Float32Array;     // если есть — IP-Adapter-FaceID
  ipAdapterWeight: 0.7;             // фиксированный вес для консистентности
  styleLoraWeight: 0.8;
  width: 1024;
  height: 1024;
  steps: 28;                        // баланс качества и скорости
  seed?: number;                    // для воспроизводимости при retry
}
```

### Style LoRA Mapping

```typescript
const STYLE_LORA = {
  '3d_cartoon':  'lora/disney-3d-v2.safetensors',
  'watercolor':  'lora/watercolor-book-v1.safetensors',
  'classic':     'lora/classic-illustration-v3.safetensors',
} as const;
```

### Face Enhancement Pipeline

```typescript
async function enhanceFace(imageBuffer: Buffer): Promise<Buffer> {
  // 1. Детектируем лицо (InsightFace)
  const faces = await detectFaces(imageBuffer);
  if (faces.length === 0) return imageBuffer; // нет лица — пропускаем

  // 2. GFPGAN для восстановления деталей
  const enhanced = await gfpgan.enhance(imageBuffer, {
    upscale: 1,          // без изменения размера (уже 1024x1024)
    bgUpsampler: 'none',
    faceUpsamplerModel: 'GFPGANv1.4',
  });

  return enhanced;
}
```

### NSFW Filter

```typescript
async function checkImageSafety(imageBuffer: Buffer): Promise<boolean> {
  const result = await safetyClassifier.predict(imageBuffer);
  if (result.nsfw > 0.5 || result.violence > 0.3) {
    await alertQueue.add('unsafe-image-detected', { timestamp: Date.now() });
    return false;
  }
  return true;
}
// При false → регенерация с safe_prompt (max 2 попытки) → fallback generic hero
```

### S3 Upload

```typescript
// Формат: stories/{storyId}/pages/{pageNum}.webp
// ACL: private, доступ только через CloudFront signed URL
// Lifecycle: удаление через 90 дней (для историй удалённых пользователей)
```

### Чеклист

- [ ] NSFW classifier на каждом изображении
- [ ] Face Enhancement (GFPGAN) при наличии лица
- [ ] IP-Adapter-FaceID weight = 0.7
- [ ] Style LoRA weight = 0.8
- [ ] WEBP 85% lossy, 1024x1024
- [ ] Retry с новым seed при NSFW срабатывании
- [ ] CloudFront signed URLs для приватного доступа

---

## SKILL 05 — Story Viewer & FlipBook

**Когда применять:** реализация просмотрщика историй, аудиоплеер, word-highlighting.

### Manifest Format

```typescript
interface StoryManifest {
  storyId: string;
  childName: string;
  theme: string;
  artStyle: string;
  createdAt: string;
  pages: Array<{
    pageNum: number;
    text: string;
    illustrationUrl: string;   // CloudFront CDN URL
    audioUrl: string;
    wordTimestamps: Array<{    // для word-highlighting
      word: string;
      start: number;           // миллисекунды
      end: number;
    }>;
  }>;
}
```

### FlipBook Component

```tsx
// Используй Framer Motion для анимации перелистывания
// Ключевые требования:
// - Свайп gesture на мобильных (useSwipeable или Framer Motion drag)
// - Аппаратное ускорение через transform3d
// - Preload следующей страницы (изображение + аудио)
// - Skeleton loader пока загружается иллюстрация

const pageTransition = {
  initial: { rotateY: -90, opacity: 0 },
  animate: { rotateY: 0, opacity: 1 },
  exit: { rotateY: 90, opacity: 0 },
  transition: { duration: 0.4, ease: 'easeInOut' }
};
```

### Word Highlighting

```typescript
// Howler.js + requestAnimationFrame для синхронизации
function useWordHighlighting(
  timestamps: WordTimestamp[],
  currentTime: number
): string | null {
  return timestamps.find(
    t => currentTime >= t.start && currentTime <= t.end
  )?.word ?? null;
}
// Подсвечиваемое слово — CSS класс `word-active` с transition 50ms
```

### Night Mode

```css
/* Автоматически по времени суток (22:00 - 07:00) или ручное переключение */
[data-night-mode="true"] {
  --bg: #1a0f00;
  --text: #f0d9a0;
  --accent: #c8891a;
  filter: brightness(0.85);
}
```

### Чеклист

- [ ] FlipBook анимация (Framer Motion)
- [ ] Свайп жесты (мобильные)
- [ ] Word-highlighting синхронно с аудио
- [ ] Автоматический night mode по времени суток
- [ ] Полноэкранный режим (без UI chrome)
- [ ] Preload следующей страницы
- [ ] Управление скоростью аудио: 0.75x / 1x / 1.25x
- [ ] 3 размера шрифта

---

## SKILL 06 — Audio Generation (TTS)

**Когда применять:** генерация аудиодорожек, word timestamps, ElevenLabs Zero Retention.

### Azure Neural TTS (основной)

```typescript
const TTS_CONFIG = {
  ru: { voice: 'ru-RU-SvetlanaNeural', rate: '-20%', pitch: '+5%' },
  en: { voice: 'en-US-AriaNeural',     rate: '-20%', pitch: '+5%' },
};

// SSML для детского темпа
const ssml = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">
  <voice name="${voice}">
    <prosody rate="${rate}" pitch="${pitch}">
      <break time="300ms"/>
      ${text}
      <break time="500ms"/>
    </prosody>
  </voice>
</speak>`;
```

### ElevenLabs (premium tier, Zero Retention)

```typescript
// Zero Retention Mode — данные не сохраняются на серверах ElevenLabs
const audio = await elevenlabs.generate({
  voice_id: NARRATOR_VOICE_IDS[narratorType],
  text: pageText,
  model_id: 'eleven_turbo_v2',
  voice_settings: { stability: 0.7, similarity_boost: 0.75 },
}, {
  headers: { 'xi-zero-retention': 'true' }
});
```

### Word Timestamps

```typescript
// Azure TTS возвращает word boundary events через WebSocket
// Собираем их в массив WordTimestamp[]
speechSynthesizer.wordBoundary = (_, event) => {
  timestamps.push({
    word: event.text,
    start: event.audioOffset / 10000, // 100ns → ms
    end: (event.audioOffset + event.duration) / 10000,
  });
};
```

### Чеклист

- [ ] Скорость речи -20% от нормы
- [ ] Паузы 500мс между абзацами (SSML)
- [ ] Word timestamps для highlighting
- [ ] Chunk-based: 1 аудио сегмент = 1 страница (параллельно)
- [ ] Zero Retention для ElevenLabs
- [ ] MP3 формат, 128kbps
- [ ] Fallback: Azure TTS при ошибке ElevenLabs

---

## SKILL 07 — PDF Export

**Когда применять:** генерация PDF для скачивания и печати.

### Puppeteer Pipeline

```typescript
async function generateStoryPDF(manifest: StoryManifest): Promise<string> {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Рендерим HTML-шаблон книги
  await page.setContent(renderBookHTML(manifest), { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  });

  await browser.close();

  // Загружаем в S3 с TTL 24 часа
  const key = `pdfs/${manifest.storyId}/${Date.now()}.pdf`;
  await s3.putObject({ Bucket: PDF_BUCKET, Key: key, Body: pdf,
    ContentType: 'application/pdf',
    Expires: new Date(Date.now() + 86400000)
  });

  return generateSignedUrl(key, 86400); // 24h signed URL
}
```

### Watermark (Free tier)

```html
<!-- Только для free тарифа -->
<div class="watermark">
  Создано в StoryMagic.ai — попробуй бесплатно!
</div>
```

### Чеклист

- [ ] DPI 300 для печати
- [ ] Два макета: экранный (альбом) и печатный (книжный)
- [ ] Имя ребёнка на обложке
- [ ] Watermark для Free тарифа
- [ ] Время генерации ≤ 30 секунд
- [ ] S3 signed URL с TTL 24 часа
- [ ] Puppeteer в отдельном сервисе (не в основном API)

---

## SKILL 08 — Content Safety (5-Layer Filter)

**Когда применять:** реализация любого компонента фильтрации контента.

### L1 — Input Filter (BFF, синхронный)

```typescript
async function l1InputFilter(userInput: string): Promise<SafetyResult> {
  // Шаг 1: Keyword blocklist (2000+ слов, мгновенно)
  const blocklistHit = BLOCKLIST.some(word =>
    userInput.toLowerCase().includes(word)
  );
  if (blocklistHit) return { safe: false, level: 'L1', reason: 'blocklist' };

  // Шаг 2: OpenAI Moderation API
  const mod = await openai.moderations.create({ input: userInput });
  if (mod.results[0].flagged) {
    return { safe: false, level: 'L1', reason: 'openai_moderation',
             categories: mod.results[0].categories };
  }

  return { safe: true };
}
```

### L2 — Prompt Guard (в системном промпте)

```typescript
const SAFETY_RULES = `
ABSOLUTE RULES (never violate):
- Never generate violence, fear, or threatening content
- Never generate romantic/sexual content of any kind
- Never reference real politicians, celebrities, or public figures
- All conflicts must be resolved peacefully
- Replace any unsafe theme with a positive alternative automatically
- Characters must always be safe, kind, and age-appropriate
`;
```

### L4 — Image NSFW Classifier

```typescript
// NudeNet или аналог через Python microservice
const THRESHOLDS = {
  nsfw: 0.5,
  violence: 0.3,
  disturbing: 0.4,
};

// При срабатывании: log + alert + regenerate (max 2 attempts)
// После 2 неудач: fallback на generic-hero без лица
```

### L5 — Manual Review Queue

```typescript
// Попадает в очередь ручного ревью если:
// - 2+ срабатывания любых фильтров за 1 генерацию
// - Жалоба пользователя
// - Аномальный паттерн использования (> 20 генераций/час)
await reviewQueue.add('manual-review', {
  storyId, userId, triggerCount, filters: triggeredFilters
});
```

### Чеклист

- [ ] L1: blocklist + OpenAI Moderation перед очередью
- [ ] L2: SAFETY_RULES в каждом системном промпте
- [ ] L3: повторный Moderation API на сгенерированный текст
- [ ] L4: NSFW classifier на каждое изображение
- [ ] L5: manual review при 2+ срабатываниях
- [ ] Логирование всех срабатываний с деталями
- [ ] False Positive Rate метрика в дашборде

---

## SKILL 09 — Stripe Monetization

**Когда применять:** интеграция Stripe, проверка лимитов, webhooks.

### Checkout Flow

```typescript
// POST /api/subscriptions/checkout
async function createCheckoutSession(userId: string, plan: PlanTier) {
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [{ price: STRIPE_PRICE_IDS[plan], quantity: 1 }],
    mode: 'subscription',
    success_url: `${APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${APP_URL}/pricing`,
    metadata: { userId, plan },
    // COPPA: для EU пользователей добавляем налоговую конфигурацию
  });
  return session.url;
}
```

### Webhook Handler

```typescript
// POST /api/webhooks/stripe (Stripe-Signature header обязателен)
const HANDLED_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
] as const;

// Идемпотентность: проверяй event.id в Redis перед обработкой
```

### Plan Limits Middleware

```typescript
// Вызывается перед POST /api/stories/generate
async function checkPlanLimits(userId: string) {
  const user = await getUser(userId);
  const limits = PLAN_LIMITS[user.subscription.tier];

  if (limits.stories !== -1) { // -1 = безлимит
    const usedThisMonth = await countStoriesThisMonth(userId);
    if (usedThisMonth >= limits.stories) {
      throw new PlanLimitError(limits.stories, user.subscription.tier);
    }
  }
}
```

### Чеклист

- [ ] Stripe webhook signature verification
- [ ] Идемпотентный webhook handler (Redis dedup)
- [ ] Plan limits middleware на генерацию
- [ ] Freemium watermark на PDF (Free tier)
- [ ] COPPA VPC через Stripe $0.01 транзакцию
- [ ] Корректный HTTP 402 с описанием плана
- [ ] Отмена подписки через Stripe (не удаляет данные)

---

## SKILL 10 — Infrastructure & DevOps

**Когда применять:** terraform конфигурация, k8s манифесты, CI/CD, мониторинг.

### AWS Architecture

```
Region: us-east-1 (primary) + eu-central-1 (EU GDPR)

EKS Cluster:
  - api pods:          2-10 replicas (HPA by CPU)
  - worker pods:       3-20 replicas (KEDA by queue depth)
  - pdf-service pods:  1-5 replicas

RDS PostgreSQL 16:
  - Multi-AZ: Yes
  - Instance: db.r6g.large (MVP), db.r6g.xlarge (scale)
  - pgvector extension enabled

ElastiCache Redis 7:
  - Cluster mode: disabled (MVP), enabled (scale)
  - Instance: cache.r6g.large

RunPod GPU (FLUX workers):
  - Type: A100 40GB или RTX 4090 (spot)
  - Auto-scale via KEDA + RunPod API
  - Min: 0, Max: 20 (cost cap)
```

### KEDA ScaledObject (GPU Workers)

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: image-worker-scaler
spec:
  scaleTargetRef:
    name: image-worker
  minReplicaCount: 0
  maxReplicaCount: 20
  triggers:
    - type: redis
      metadata:
        listName: story-image-queue
        listLength: "2"  # 1 воркер на каждые 2 задачи в очереди
```

### GitHub Actions CI/CD

```yaml
# Обязательные шаги в порядке выполнения:
# 1. Lint (ESLint + TypeScript check)
# 2. Unit tests (Vitest) — coverage ≥ 80%
# 3. Safety test suite (50 unsafe prompts)
# 4. Build (Docker images)
# 5. E2E tests (Playwright) — только на main branch
# 6. Security scan (Snyk)
# 7. Deploy to staging → smoke test → deploy to prod
```

### Чеклист

- [ ] Terraform state в S3 с locking через DynamoDB
- [ ] Два региона: us-east-1 + eu-central-1
- [ ] KEDA autoscaling для GPU workers
- [ ] HPA для API pods (CPU 70% threshold)
- [ ] PgBouncer перед PostgreSQL (max 200 connections)
- [ ] CloudFront перед S3 (signed URLs для медиа)
- [ ] Grafana dashboard: generation time P50/P95, queue depth, GPU utilization
- [ ] PagerDuty алёрты (по правилам из rules.md)

---

## SKILL 11 — Referral & Sharing

**Когда применять:** реферальная программа, share-ссылки, виральные механики.

### Share Link Generation

```typescript
// Временная read-only ссылка на историю (TTL 30 дней)
async function generateShareLink(storyId: string, userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  await redis.setex(
    `share:${token}`,
    30 * 24 * 60 * 60, // 30 дней
    JSON.stringify({ storyId, userId })
  );
  return `${APP_URL}/stories/share/${token}`;
}

// GET /api/stories/share/:token — публичный доступ без аутентификации
// На странице: CTA "Создай свою историю" + ограниченный просмотр (3 страницы)
```

### Referral Mechanics

```typescript
// При регистрации по реферальной ссылке (?ref=USER_ID)
async function processReferral(newUserId: string, referrerId: string) {
  await prisma.referral.create({
    data: { referrerId, referredId: newUserId }
  });
  // +3 бонусные истории реферреру (начисляются после первой истории реферала)
  // Бонус начисляется через BullMQ (не синхронно)
  await referralQueue.add('process-referral-bonus', { referrerId, newUserId });
}
```

### Чеклист

- [ ] Share link через Redis (TTL 30 дней)
- [ ] Публичный просмотр: 3 страницы бесплатно + CTA
- [ ] Реферальный трекинг через `?ref=` параметр
- [ ] +3 истории рефереру после активации реферала
- [ ] Водяной знак на PDF Free тарифа
- [ ] Analytics события: share_created, share_opened, referral_converted

---

## SKILL 12 — Analytics & Metrics

**Когда применять:** трекинг событий, retention метрики, продуктовые KPI.

### Ключевые события для трекинга

```typescript
// Все события отправляются в PostHog через серверный SDK (не клиентский)
const TRACKED_EVENTS = {
  // Onboarding funnel
  'user_registered':        { userId, method },
  'coppa_verified':         { userId },
  'child_profile_created':  { userId, childAge, interestsCount },
  'photo_uploaded':         { userId, qualityScore },

  // Generation funnel
  'story_generation_started':   { userId, theme, artStyle, hasPhoto },
  'story_generation_completed': { userId, durationMs, pageCount },
  'story_generation_failed':    { userId, errorType, attempt },

  // Engagement
  'story_viewed':          { userId, storyId, completedPages, totalPages },
  'story_completed':       { userId, storyId },
  'pdf_downloaded':        { userId, storyId, tier },
  'share_link_created':    { userId, storyId },
  'share_link_opened':     { token, pageView: true },

  // Monetization
  'upgrade_cta_shown':     { userId, trigger, currentTier },
  'checkout_started':      { userId, targetTier },
  'subscription_created':  { userId, tier, mrr },
  'referral_converted':    { referrerId, newUserId },
} as const;
```

### KPI Dashboard (Grafana)

```
Продуктовые:
  - D7/D30 Retention (цель: 40% / 20%)
  - Stories per user / month (цель: ≥ 8)
  - Free → Paid conversion (цель: ≥ 8%)
  - Story completion rate (цель: ≥ 70%)

Технические:
  - P50/P95 generation time
  - GPU queue depth (алёрт > 30)
  - API error rate (алёрт > 2%)
  - Content filter false positive rate
```

### Чеклист

- [ ] Серверный трекинг (PostHog Node.js SDK)
- [ ] Все события из TRACKED_EVENTS
- [ ] Retention когорты в PostHog/ClickHouse
- [ ] Grafana дашборд с техническими метриками
- [ ] Алёрты через PagerDuty (правила из rules.md)
- [ ] A/B тест IP-Adapter vs PuLID (1000 пользователей)
