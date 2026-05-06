"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, ShieldCheck, X,
  House, BookOpen, User, Bell, Sparkles,
  CloudUpload, ChevronDown, ChevronUp, Calendar,
  Camera, SlidersHorizontal, Search, Heart,
  Wand2, Star, Image as ImageIcon, UserRound, Target, Smile, Palette,
  type LucideIcon,
} from "lucide-react";
import { createChild, patchChild, uploadChildPhoto, AuthError, ApiError } from "@/lib/api";

// ── Constants ─────────────────────────────────────────────────────────────────

const INTEREST_GROUPS = [
  { label: "Фантазия и приключения", emoji: "🐉", items: ["dinosaurs","princesses","magic","superheroes","dragons","fairies","pirates","knights"] },
  { label: "Техника и наука",         emoji: "🚀", items: ["space","robots","cars","experiments","inventions","electronics"] },
  { label: "Природа",                 emoji: "🌿", items: ["animals","sea","nature","birds","insects","forest"] },
  { label: "Творчество",              emoji: "🎨", items: ["music","drawing","cooking","sculpting","photography"] },
  { label: "Спорт и активность",      emoji: "⚽", items: ["sport","football","swimming","cycling","dancing","gymnastics"] },
  { label: "Игры и игрушки",          emoji: "🎮", items: ["lego","board_games","dolls","video_games","puzzles"] },
  { label: "Книги и истории",         emoji: "📚", items: ["fairy_tales","comics","encyclopedias"] },
];

const INTEREST_LABELS: Record<string, string> = {
  dinosaurs: "Динозавры", princesses: "Принцессы", magic: "Магия", superheroes: "Супергерои",
  dragons: "Драконы", fairies: "Феи", pirates: "Пираты", knights: "Рыцари",
  space: "Космос", robots: "Роботы", cars: "Машины", experiments: "Эксперименты",
  inventions: "Изобретения", electronics: "Электроника",
  animals: "Животные", sea: "Море", nature: "Природа", birds: "Птицы",
  insects: "Насекомые", forest: "Лес",
  music: "Музыка", drawing: "Рисование", cooking: "Кулинария",
  sculpting: "Лепка", photography: "Фотография",
  sport: "Спорт", football: "Футбол", swimming: "Плавание",
  cycling: "Велоспорт", dancing: "Танцы", gymnastics: "Гимнастика",
  lego: "Лего", board_games: "Настольные игры", dolls: "Куклы",
  video_games: "Видеоигры", puzzles: "Пазлы",
  fairy_tales: "Сказки", comics: "Комиксы", encyclopedias: "Энциклопедии",
};

const TRAIT_LABELS: Record<string, string> = {
  brave: "Смелый", curious: "Любопытный", kind: "Добрый", cheerful: "Весёлый",
  creative: "Творческий", stubborn: "Упрямый", cautious: "Осторожный", empathetic: "Чуткий",
  energetic: "Энергичный", dreamy: "Мечтательный", smart: "Умный", mischievous: "Озорной",
  patient: "Терпеливый", calm: "Спокойный", polite: "Вежливый", friendly: "Дружелюбный",
  caring: "Заботливый", attentive: "Внимательный", determined: "Целеустремлённый",
  independent: "Самостоятельный", responsible: "Ответственный", accurate: "Аккуратный",
  serious: "Серьёзный", leader: "Лидер", artistic: "Артистичный", humorous: "Юморной",
};

const TRAIT_GROUPS = [{ label: "", emoji: "", items: Object.keys(TRAIT_LABELS) }];

const HAIR_SWATCHES = [
  { value: "not_specified", color: "#1C1740" },
  { value: "black",         color: "#1a1a1a" },
  { value: "dark_brown",    color: "#3d2218" },
  { value: "brown",         color: "#6b3a25" },
  { value: "light_brown",   color: "#8b5a3c" },
  { value: "dark_blonde",   color: "#6e5a3e" },
  { value: "light_blonde",  color: "#b89968" },
  { value: "red",           color: "#d4592c" },
  { value: "platinum",      color: "#e8d8b0" },
];

const EYE_SWATCHES = [
  { value: "not_specified", color: "#1C1740" },
  { value: "dark_brown",    color: "#3d2010" },
  { value: "brown",         color: "#7a4a25" },
  { value: "green",         color: "#3a7a48" },
  { value: "light_blue",    color: "#7eb6d8" },
  { value: "blue",          color: "#3b6cb0" },
  { value: "grey",          color: "#8a8e96" },
  { value: "amber",         color: "#c08840" },
];

const APPEARANCE_FEATURES = [
  { value: "glasses",    label: "Очки" },
  { value: "freckles",   label: "Веснушки" },
  { value: "curly_hair", label: "Кудрявые волосы" },
  { value: "braids",     label: "Косички / хвосты" },
  { value: "short_hair", label: "Короткая стрижка" },
  { value: "long_hair",  label: "Длинные волосы" },
];

const VISIBLE_FEATURES = [
  { value: "wheelchair",     label: "Инвалидное кресло" },
  { value: "hearing_aid",    label: "Слуховой аппарат" },
  { value: "white_cane",     label: "Белая трость" },
  { value: "arm_prosthesis", label: "Протез руки" },
  { value: "leg_prosthesis", label: "Протез ноги" },
];

const PET_TYPES = [
  { value: "cat",    label: "Кот" },
  { value: "dog",    label: "Собака" },
  { value: "rabbit", label: "Кролик" },
  { value: "parrot", label: "Попугай" },
  { value: "turtle", label: "Черепаха" },
  { value: "fish",   label: "Рыбка" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  nickname: string;
  birthDate: string;
  gender: "BOY" | "GIRL" | "NOT_SPECIFIED";
  interests: string[];
  characterTraits: string[];
  recentAchievements: string;
  dreamsAndGoals: string;
  petType: string;
  petName: string;
  hairColor: string;
  eyeColor: string;
  appearanceFeatures: string[];
  visibleFeatures: string[];
  specialNotes: string;
}

const INITIAL: FormData = {
  name: "", nickname: "", birthDate: "", gender: "BOY",
  interests: [], characterTraits: [],
  recentAchievements: "", dreamsAndGoals: "", petType: "", petName: "",
  hairColor: "not_specified", eyeColor: "not_specified",
  appearanceFeatures: [], visibleFeatures: [], specialNotes: "",
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AddChildPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [childId, setChildId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [photoMode, setPhotoMode] = useState<"photo" | "manual">("photo");
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleList(
    key: "interests" | "characterTraits" | "appearanceFeatures" | "visibleFeatures",
    val: string,
  ) {
    setForm((f) => {
      const list = f[key] as string[];
      return { ...f, [key]: list.includes(val) ? list.filter((x) => x !== val) : [...list, val] };
    });
  }

  async function handleNext() {
    setErrors([]);
    
    if (step === 1) {
      const errs: string[] = [];
      if (!form.name.trim()) errs.push("Введите имя ребёнка");
      if (!form.birthDate) errs.push("Укажите дату рождения");
      if (errs.length) { setErrors(errs); return; }
      setStep(2);
      return;
    } else if (step === 2) {
      setStep(3);
      return;
    }

    setLoading(true);
    try {
      const child = await createChild({
        name: form.name.trim(),
        nickname: form.nickname.trim() || undefined,
        birthDate: new Date(form.birthDate).toISOString(),
        gender: form.gender,
        interests: form.interests,
        characterTraits: form.characterTraits,
        recentAchievements: form.recentAchievements || undefined,
        dreamsAndGoals: form.dreamsAndGoals || undefined,
        petType: form.petType || undefined,
        petName: form.petName.trim() || undefined,
        hairColor: form.hairColor === "not_specified" ? undefined : form.hairColor,
        eyeColor: form.eyeColor === "not_specified" ? undefined : form.eyeColor,
        appearanceFeatures: form.appearanceFeatures,
        visibleFeatures: form.visibleFeatures,
        specialNotes: form.specialNotes || undefined,
      } as Parameters<typeof createChild>[0]);
      
      setChildId(child.id);

      if (photoMode === "photo" && photos.length > 0) {
        for (const photo of photos) {
          try { await uploadChildPhoto(child.id, photo); } catch { /* non-blocking */ }
        }
      }
      router.push("/home");
    } catch (err) {
      if (err instanceof AuthError) {
        router.replace("/login");
      } else if (err instanceof ApiError) {
        setErrors([err.message]);
      } else {
        setErrors(["Что-то пошло не так. Попробуйте ещё раз."]);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    setStep(3);
  }

  function handleBack() {
    if (step === 1) router.push("/home");
    else setStep((s) => s - 1);
  }

  const rightPanels: {
    Icon: LucideIcon;
    title: string;
    subtitle: string;
    bullets: {
      Icon: LucideIcon;
      text: string;
      variant?: "green";
    }[];
  }[] = [
    {
      Icon: Wand2,
      title: "Персонаж вашего ребёнка оживёт в сказке",
      subtitle: "Каждая деталь помогает ИИ создать по-настоящему уникального героя — со своим именем, характером и любимыми занятиями",
      bullets: [
        { Icon: UserRound, text: "Уникальный персонаж с характером вашего ребёнка" },
        { Icon: BookOpen,  text: "Сказки, адаптированные под возраст и интересы" },
        { Icon: ImageIcon, text: "Иллюстрации в стиле, который нравится ребёнку" },
      ],
    },
    {
      Icon: Star,
      title: "Как интересы делают сказку особенной",
      subtitle: "Чем точнее вы расскажете о ребёнке, тем ярче получится история",
      bullets: [
        { Icon: Target,   text: "Интересы → сказки с любимыми темами: космос, динозавры, приключения" },
        { Icon: Smile,    text: "Черты характера → герой, похожий по духу на вашего ребёнка" },
        { Icon: BookOpen, text: "Нарратив → стиль повествования, который нравится именно вашему ребёнку" },
      ],
    },
    {
      Icon: ImageIcon,
      title: "Иллюстрации, которые вас удивят",
      subtitle: "Фото и описание внешности помогают создать персонажа, который выглядит как ваш ребёнок",
      bullets: [
        { Icon: Camera,      text: "Чёткое фото при хорошем освещении даёт наилучший результат" },
        { Icon: Palette,     text: "Описание цвета волос и глаз поможет ИИ нарисовать похожего персонажа" },
        { Icon: ShieldCheck, text: "Данные зашифрованы и никогда не передаются третьим лицам", variant: "green" },
      ],
    },
  ];
  const rightPanel = rightPanels[step - 1];
  const RightIcon = rightPanel.Icon;
  const stepLabels = ["Основная информация", "Интересы и персонализация", "Фото и внешность"];
  const sessionExpired = errors.some((e) => e.includes("Сессия истекла"));

  return (
    <div className="min-h-screen flex font-sans" style={{ background: "#0F0A2E" }}>

      {/* ── Sidebar — desktop only ── */}
      <aside
        className="hidden lg:flex flex-col justify-between flex-shrink-0"
        style={{ width: 240, background: "#080617" }}
      >
        <div className="flex flex-col gap-2">
          <div style={{ padding: "32px 24px 20px" }}>
            <Link href="/home" className="text-white font-bold hover:opacity-80 transition-opacity" style={{ fontSize: 20 }}>
              ✨ EverStory
            </Link>
          </div>
          <nav className="flex flex-col gap-1 px-3">
            <SideNavItem icon={<House size={18} />} label="Главная" href="/home" active />
            <SideNavItem icon={<BookOpen size={18} />} label="Истории" href="/library" />
            <SideNavItem icon={<User size={18} />} label="Профиль" href="/profile" />
          </nav>
        </div>
        <div className="flex items-center gap-3 px-4 py-5" style={{ background: "#0D0A24" }}>
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{ width: 40, height: 40, background: "linear-gradient(135deg, #7B2FFF 0%, #FF6B9D 100%)" }}
          >
            <User size={18} color="#FFFFFF" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-white text-[13px] font-semibold">Мой профиль</span>
            <span className="text-[11px] truncate" style={{ color: "#9B8EC4" }}>1 ребёнок · 18 историй</span>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Desktop top bar */}
        <header
          className="hidden lg:flex items-center justify-between flex-shrink-0 px-10"
          style={{ height: 72, background: "#080617", borderBottom: "1px solid #1A1050" }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-white text-[18px] font-bold">Создание профиля ребёнка</span>
            <span style={{ color: "#9B8EC4", fontSize: 13 }}>Шаг {step} из 3 · {stepLabels[step - 1]}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="flex items-center justify-center rounded-full"
              style={{ width: 40, height: 40, background: "#1A1050" }}
            >
              <Bell size={18} color="#9B8EC4" />
            </button>
            <button
              className="flex items-center gap-2 text-[14px] font-bold"
              style={{ borderRadius: 20, background: "#FFB703", color: "#0F0A2E", padding: "10px 20px" }}
            >
              <Sparkles size={16} color="#0F0A2E" />
              Создать сказку
            </button>
          </div>
        </header>

        {/* Mobile top bar */}
        <div
          className="flex lg:hidden items-center justify-between flex-shrink-0 px-4"
          style={{ height: 60, background: "#080617", borderBottom: "1px solid #1A1050" }}
        >
          <Link href="/home" className="text-white font-bold" style={{ fontSize: 16 }}>✨ EverStory</Link>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center justify-center rounded-full"
              style={{ width: 34, height: 34, background: "#1A1050" }}
            >
              <Bell size={15} color="#9B8EC4" />
            </button>
            <button
              className="flex items-center gap-[5px] text-[12px] font-bold"
              style={{ borderRadius: 17, background: "#FFB703", color: "#0F0A2E", padding: "8px 12px" }}
            >
              <Sparkles size={12} color="#0F0A2E" />
              Создать
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-w-0 overflow-hidden">

          {/* Form column */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="w-full px-4 lg:px-10 pt-6 pb-28 lg:pb-10 flex flex-col gap-6">

              <Stepper step={step} labels={stepLabels} />

              {/* Errors */}
              {errors.length > 0 && (
                <div
                  className="rounded-[12px] px-4 py-3 flex flex-col gap-1.5"
                  style={{ background: "#3B0F0F", border: "1px solid #7F1D1D" }}
                >
                  {errors.map((e, i) => (
                    <span key={i} className="text-[13px]" style={{ color: "#F87171" }}>{e}</span>
                  ))}
                  {sessionExpired && (
                    <Link href="/home" className="text-[13px] font-semibold mt-1" style={{ color: "#C4B5FD" }}>
                      Перейти на главную →
                    </Link>
                  )}
                </div>
              )}

              {step === 1 && <Step1 form={form} set={set} />}
              {step === 2 && <Step2 form={form} set={set} toggleList={toggleList} />}
              {step === 3 && (
                <Step3
                  form={form}
                  set={set}
                  toggleList={toggleList}
                  photoMode={photoMode}
                  setPhotoMode={setPhotoMode}
                  photos={photos}
                  setPhotos={setPhotos}
                />
              )}

              {/* Nav buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-[6px] text-[14px] font-semibold"
                  style={{
                    borderRadius: 24, background: "#1C1740", color: "#FFFFFF",
                    border: "1.5px solid #2D1B6B", padding: "14px 22px",
                  }}
                >
                  <ArrowLeft size={16} color="#C4B5FD" />
                  Назад
                </button>

                {step === 2 && (
                  <button
                    onClick={handleSkip}
                    className="text-[12px] font-medium"
                    style={{ color: "#C4B5FD" }}
                  >
                    Пропустить
                  </button>
                )}

                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="flex items-center gap-[6px] text-white text-[14px] font-bold disabled:opacity-60"
                  style={{
                    borderRadius: 24,
                    background: "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)",
                    padding: "14px 22px",
                  }}
                >
                  {loading ? (
                    "Загрузка..."
                  ) : step < 3 ? (
                    <><span>Далее</span><ArrowRight size={16} /></>
                  ) : (
                    <><Sparkles size={16} /><span>Сохранить профиль</span></>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Right info panel — desktop only */}
          <div
            className="hidden lg:flex flex-col justify-center flex-shrink-0"
            style={{ width: 440, background: "#100839", borderLeft: "1px solid #2D1B6B", padding: "48px 56px" }}
          >
            <div className="flex flex-col items-center gap-7">
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 72, height: 72, background: "linear-gradient(135deg, #7B2FFF 0%, #4F46E5 100%)" }}
              >
                <RightIcon size={36} color="#FFFFFF" />
              </div>
              <div className="flex flex-col gap-3 w-full">
                <span className="text-white font-bold leading-snug text-center" style={{ fontSize: 24 }}>
                  {rightPanel.title}
                </span>
                <span className="leading-relaxed text-center" style={{ fontSize: 14, color: "#9B8EC4" }}>
                  {rightPanel.subtitle}
                </span>
              </div>
              <div className="flex flex-col gap-3 w-full">
                {rightPanel.bullets.map(({ Icon, text, variant }, i) => {
                  const green = variant === "green";
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-[14px] rounded-[12px]"
                      style={{
                        background: green ? "#0D2E1E" : "#1C1440",
                        border: `1px solid ${green ? "#1A5C38" : "#2D1B6B"}`,
                        padding: "14px 16px",
                      }}
                    >
                      <div
                        className="flex-shrink-0 flex items-center justify-center rounded-[10px]"
                        style={{ width: 36, height: 36, background: green ? "#1A5C38" : "#2D1B6B" }}
                      >
                        <Icon size={18} color={green ? "#4ADE80" : "#9B6FFF"} />
                      </div>
                      <span
                        className="leading-relaxed"
                        style={{ fontSize: 13, color: green ? "#6EC99A" : "#CEBED8" }}
                      >
                        {text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around"
        style={{ height: 72, background: "#080617", borderTop: "1px solid #1A1050" }}
      >
        <BottomTab icon={<House size={20} />} label="Главная" href="/home" active />
        <BottomTab icon={<BookOpen size={20} />} label="Истории" href="/library" />
        <BottomTab icon={<User size={20} />} label="Профиль" href="/profile" />
      </nav>

    </div>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center">
        {labels.map((_, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={n} className="flex items-center" style={{ flex: n < labels.length ? 1 : undefined }}>
              <div
                className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
                style={{
                  width: 32, height: 32, fontSize: 14,
                  background: done || active
                    ? "linear-gradient(135deg, #7B2FFF 0%, #4F46E5 100%)"
                    : "#1C1740",
                  color: done || active ? "#FFFFFF" : "#6B5DAA",
                  border: done || active ? "none" : "1.5px solid #2D1B6B",
                }}
              >
                {done ? <Check size={16} /> : n}
              </div>
              {n < labels.length && (
                <div
                  className="flex-1 mx-2"
                  style={{
                    height: 2,
                    background: done
                      ? "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)"
                      : "#2D1B6B",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <span className="font-medium" style={{ fontSize: 13, color: "#C4B5FD" }}>
        Шаг {step} из {labels.length} · {labels[step - 1]}
      </span>
    </div>
  );
}

// ── Step 1: Basic info ────────────────────────────────────────────────────────

function Step1({
  form,
  set,
}: {
  form: FormData;
  set: <K extends keyof FormData>(key: K, v: FormData[K]) => void;
}) {
  const dateRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="text-white font-bold" style={{ fontSize: 18 }}>Основная информация</span>
        <span style={{ fontSize: 13, color: "#9B8EC4" }}>
          ИИ использует эти данные для создания уникального героя вашего ребёнка
        </span>
      </div>

      <Field label="Имя ребёнка" required>
        <TextInput value={form.name} onChange={(v) => set("name", v)} placeholder="Александр" />
      </Field>

      <Field label="Как называете дома" optional>
        <TextInput value={form.nickname} onChange={(v) => set("nickname", v)} placeholder="Саша, Сашуля..." />
        <Helper>Именно это имя будет в тексте сказки</Helper>
      </Field>

      <Field label="Дата рождения" required>
        <div className="relative">
          <input
            ref={dateRef}
            type="date"
            value={form.birthDate}
            onChange={(e) => set("birthDate", e.target.value)}
            className="w-full outline-none"
            style={{
              background: "#1C1740", border: "1.5px solid #2D1B6B", borderRadius: 14,
              padding: "0 48px 0 16px", height: 52,
              color: form.birthDate ? "#FFFFFF" : "#6B5DAA",
              fontSize: 14, colorScheme: "dark",
            }}
          />
          <button
            type="button"
            onClick={() => dateRef.current?.showPicker()}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center"
          >
            <Calendar size={18} color="#7B2FFF" />
          </button>
        </div>
        <Helper>Автоматически подберём сложность текста: 2–4 / 5–7 / 8–12 лет</Helper>
      </Field>

      <Field label="Пол" required>
        <div className="flex gap-2">
          {(["BOY", "GIRL", "NOT_SPECIFIED"] as const).map((g) => {
            const labels = { BOY: "♂ Мальчик", GIRL: "♀ Девочка", NOT_SPECIFIED: "Не указывать" };
            const active = form.gender === g;
            return (
              <button
                key={g}
                onClick={() => set("gender", g)}
                className="flex-1 flex items-center justify-center font-semibold transition-all"
                style={{
                  borderRadius: 14, height: 48, fontSize: 13,
                  background: active ? "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)" : "#1C1740",
                  color: active ? "#FFFFFF" : "#9B8EC4",
                  border: active ? "none" : "1.5px solid #2D1B6B",
                }}
              >
                {labels[g]}
              </button>
            );
          })}
        </div>
        <Helper>Влияет на местоимения и образ героя в иллюстрациях</Helper>
      </Field>
    </div>
  );
}

// ── Step 2: Interests & personalization ───────────────────────────────────────

function Step2({
  form,
  set,
  toggleList,
}: {
  form: FormData;
  set: <K extends keyof FormData>(key: K, v: FormData[K]) => void;
  toggleList: (key: "interests" | "characterTraits" | "appearanceFeatures" | "visibleFeatures", val: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-white font-bold" style={{ fontSize: 18 }}>Интересы и персонализация</span>
        <span style={{ fontSize: 13, color: "#9B8EC4" }}>
          Чем точнее вы расскажете о ребёнке, тем ярче получится история
        </span>
      </div>

      {/* Interests multiselect */}
      <Field label="Интересы и увлечения" optional>
        <MultiSelectDropdown
          value={form.interests}
          onChange={(vals) => set("interests", vals)}
          groups={INTEREST_GROUPS}
          labels={INTEREST_LABELS}
          max={10}
          placeholder="Добавьте интересы..."
          searchPlaceholder="Поиск интереса..."
        />
        <Helper>Выбрано: {form.interests.length} / 10 — чем больше, тем богаче сюжет</Helper>
      </Field>

      {/* Character traits */}
      <div className="flex flex-col gap-3">
        <SectionHeader label="Характер и личность" />
        <Field label="Черты характера" optional>
          <MultiSelectDropdown
            value={form.characterTraits}
            onChange={(vals) => set("characterTraits", vals)}
            groups={TRAIT_GROUPS}
            labels={TRAIT_LABELS}
            placeholder="Добавьте черты характера..."
            searchPlaceholder="Поиск черты..."
          />
          <Helper>Герой сказки будет вести себя именно так — решать задачи в своём стиле</Helper>
        </Field>
      </div>

      {/* Narrative section */}
      <div className="flex flex-col gap-4">
        <SectionHeader label="Персонализация нарратива" />
        <Field label="Недавние достижения" optional>
          <TextArea
            value={form.recentAchievements}
            onChange={(v) => set("recentAchievements", v)}
            placeholder="Научился кататься на велосипеде, получил грамоту в садике..."
            rows={3}
          />
          <Helper>Герой отметит это в сказке — закрепляет победу</Helper>
        </Field>
        <Field label="Мечты и цели" optional>
          <TextArea
            value={form.dreamsAndGoals}
            onChange={(v) => set("dreamsAndGoals", v)}
            placeholder="Хочет стать космонавтом, мечтает завести щенка..."
            rows={3}
          />
          <Helper>Сказка покажет ребёнка уже в этой роли</Helper>
        </Field>
      </div>

      {/* Pet section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionHeader label="Питомец" />
          <span
            className="font-semibold"
            style={{
              fontSize: 10, color: "#FFB703", borderRadius: 10,
              background: "#FFB70322", border: "1px solid #FFB70355",
              padding: "3px 8px",
            }}
          >
            рекомендуем добавить
          </span>
        </div>
        <Field label="Питомец и кличка" optional>
          <div className="flex flex-col gap-2 lg:flex-row">
            <div className="relative flex-1">
              <select
                value={form.petType}
                onChange={(e) => set("petType", e.target.value)}
                className="w-full outline-none appearance-none"
                style={{
                  background: "#1C1740", border: "1.5px solid #2D1B6B", borderRadius: 14,
                  padding: "0 40px 0 14px", height: 52,
                  color: form.petType ? "#FFFFFF" : "#6B5DAA", fontSize: 14,
                  colorScheme: "dark",
                }}
              >
                <option value="">Вид питомца</option>
                {PET_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <ChevronDown size={16} color="#7B2FFF" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="flex-1">
              <TextInput value={form.petName} onChange={(v) => set("petName", v)} placeholder="Кличка (Барсик, Рекс...)" />
            </div>
          </div>
          <Helper>Питомец станет верным спутником героя во всех приключениях</Helper>
        </Field>
      </div>
    </div>
  );
}

// ── Step 3: Photo / appearance ────────────────────────────────────────────────

function Step3({
  form,
  set,
  toggleList,
  photoMode,
  setPhotoMode,
  photos,
  setPhotos,
}: {
  form: FormData;
  set: <K extends keyof FormData>(key: K, v: FormData[K]) => void;
  toggleList: (key: "interests" | "characterTraits" | "appearanceFeatures" | "visibleFeatures", val: string) => void;
  photoMode: "photo" | "manual";
  setPhotoMode: (m: "photo" | "manual") => void;
  photos: File[];
  setPhotos: (f: File[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files)
        .filter((f) => f.type === "image/jpeg" || f.type === "image/png")
        .slice(0, 5);
      setPhotos(files);
    },
    [setPhotos],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setPhotos(files);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="text-white font-bold" style={{ fontSize: 18 }}>Фото и внешность</span>
        <span style={{ fontSize: 13, color: "#9B8EC4" }}>необязательно</span>
      </div>

      {/* Mode toggle */}
      <div
        className="flex rounded-[12px] gap-1"
        style={{ background: "#1C1740", border: "1.5px solid #2D1B6B", padding: 3 }}
      >
        {(["photo", "manual"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setPhotoMode(m)}
            className="flex-1 flex items-center justify-center gap-[6px] rounded-[10px] font-semibold transition-all"
            style={{
              height: 38, fontSize: 13,
              background: photoMode === m ? "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)" : "transparent",
              color: photoMode === m ? "#FFFFFF" : "#9B8FD0",
            }}
          >
            {m === "photo" ? (
              <><Camera size={15} /> Загрузить фото</>
            ) : (
              <><SlidersHorizontal size={15} /> Вручную</>
            )}
          </button>
        ))}
      </div>

      {photoMode === "photo" ? (
        <>
          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-[14px] rounded-[16px] cursor-pointer transition-all"
            style={{
              border: `1.5px solid ${dragging ? "#7B2FFF" : "#7B2FFF66"}`,
              background: dragging ? "#1A1050" : "#1C1740",
              padding: "28px 20px",
            }}
          >
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 64, height: 64,
                background: "linear-gradient(135deg, rgba(123,47,255,0.2) 0%, rgba(79,70,229,0.2) 100%)",
              }}
            >
              <CloudUpload size={30} color="#FFFFFF" />
            </div>

            {photos.length > 0 ? (
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-white font-bold" style={{ fontSize: 15 }}>{photos.length} фото выбрано</span>
                <span style={{ fontSize: 12, color: "#9B8FD0" }}>
                  {photos.map((f) => f.name).join(", ")}
                </span>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-[6px] text-center">
                  <span className="text-white font-bold" style={{ fontSize: 15 }}>Загрузить фото (1–5 фотографий)</span>
                  <span className="leading-relaxed" style={{ fontSize: 12, color: "#9B8FD0" }}>
                    JPG, PNG · до 10 МБ каждая · нажмите или перетащите
                  </span>
                </div>
                <div className="flex flex-col gap-[6px] w-full" style={{ maxWidth: 340 }}>
                  {[
                    "Хорошее освещение, лицо анфас или ¾",
                    "Больше фото — точнее сходство персонажа",
                    "Избегайте фото в тёмных очках или масках",
                    "Минимальное разрешение: 480 × 480 px",
                  ].map((tip) => (
                    <div key={tip} className="flex items-center gap-2">
                      <Check size={14} color="#7B2FFF" className="flex-shrink-0" />
                      <span className="leading-relaxed" style={{ fontSize: 12, color: "#C4B5FD" }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Privacy notice */}
          <div
            className="flex items-start gap-3 rounded-[14px] px-4 py-4"
            style={{ background: "#1A2E1F", border: "1px solid #2E5D3E" }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{ width: 36, height: 36, background: "#2E5D3E" }}
            >
              <ShieldCheck size={18} color="#7AE2A1" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold" style={{ fontSize: 12, color: "#7AE2A1" }}>
                Фотографии не хранятся на наших серверах.
              </span>
              <span className="leading-relaxed" style={{ fontSize: 12, color: "#B8E8C8" }}>
                Мы извлекаем векторное представление лица (512-мерный эмбеддинг) и немедленно удаляем оригинальные файлы. Данные зашифрованы AES-256 и привязаны только к вашему аккаунту.
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Appearance section */}
          <div className="flex flex-col gap-4">
            <SectionHeader label="Внешность для иллюстраций" size={15} />

            <Field label="Цвет волос" optional>
              <div className="flex flex-wrap gap-[10px]">
                {HAIR_SWATCHES.map((s) => (
                  <ColorSwatch
                    key={s.value}
                    color={s.color}
                    selected={form.hairColor === s.value}
                    onClick={() => set("hairColor", s.value)}
                  />
                ))}
              </div>
            </Field>

            <Field label="Цвет глаз" optional>
              <div className="flex flex-wrap gap-[10px]">
                {EYE_SWATCHES.map((s) => (
                  <ColorSwatch
                    key={s.value}
                    color={s.color}
                    selected={form.eyeColor === s.value}
                    onClick={() => set("eyeColor", s.value)}
                  />
                ))}
              </div>
            </Field>

            <Field label="Особенности внешности" optional>
              <div className="flex flex-wrap gap-2">
                {APPEARANCE_FEATURES.map((f) => (
                  <FeatureChip
                    key={f.value}
                    label={f.label}
                    active={form.appearanceFeatures.includes(f.value)}
                    onClick={() => toggleList("appearanceFeatures", f.value)}
                  />
                ))}
              </div>
              <Helper>Эти детали будут отражены в каждой иллюстрации</Helper>
            </Field>
          </div>

          {/* Individual features section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <SectionHeader label="Индивидуальные особенности" size={15} />
              <span style={{ fontSize: 12, color: "#6B5DAA" }}>необязательно</span>
            </div>

            {/* Empathy card */}
            <div
              className="flex items-start gap-3 rounded-[14px]"
              style={{ background: "#2A1A52", border: "1px solid #7B2FFF44", padding: 14 }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-full"
                style={{ width: 36, height: 36, background: "linear-gradient(180deg, #7B2FFF 0%, #FFB703 100%)" }}
              >
                <Heart size={18} color="#FFFFFF" />
              </div>
              <span className="leading-relaxed" style={{ fontSize: 12, color: "#E0D5FF" }}>
                В сказке любая особенность становится частью силы героя. ИИ напишет истории с уважением — без акцента на ограничениях.
              </span>
            </div>

            <Field label="Видимые особенности" optional>
              <div className="flex flex-wrap gap-2">
                {VISIBLE_FEATURES.map((f) => (
                  <FeatureChip
                    key={f.value}
                    label={f.label}
                    active={form.visibleFeatures.includes(f.value)}
                    onClick={() => toggleList("visibleFeatures", f.value)}
                  />
                ))}
              </div>
              <Helper>Будут естественной частью образа героя — как и любая другая черта</Helper>
            </Field>

            <Field label="Что важно учесть" optional>
              <TextArea
                value={form.specialNotes}
                onChange={(v) => set("specialNotes", v)}
                placeholder="Аллергия на что-то, не любит громкие звуки..."
                rows={3}
              />
              <Helper>Сказка деликатно учтёт эти детали</Helper>
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MultiSelect dropdown ──────────────────────────────────────────────────────

interface MsGroup { label: string; emoji: string; items: string[] }

function MultiSelectDropdown({
  value,
  onChange,
  groups,
  labels,
  max,
  placeholder,
  searchPlaceholder,
}: {
  value: string[];
  onChange: (val: string[]) => void;
  groups: MsGroup[];
  labels: Record<string, string>;
  max?: number;
  placeholder?: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  function toggle(item: string) {
    if (value.includes(item)) {
      onChange(value.filter((x) => x !== item));
    } else if (!max || value.length < max) {
      onChange([...value, item]);
    }
  }

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (i) => !search || labels[i]?.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((g) => g.items.length > 0);

  const showGroupHeaders = groups.length > 1;

  return (
    <div className="flex flex-col gap-2">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left"
        style={{
          borderRadius: 14, background: "#1C1740",
          border: `1.5px solid ${open ? "#7B2FFF" : "#2D1B6B"}`,
          padding: "10px 12px", minHeight: 50,
        }}
      >
        <div className="flex flex-wrap gap-[6px] flex-1 min-w-0">
          {value.length > 0 ? (
            value.map((item) => (
              <span
                key={item}
                className="font-semibold flex-shrink-0 inline-flex items-center"
                style={{
                  borderRadius: 14, height: 28, padding: "0 10px", gap: 6,
                  background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)",
                  color: "#FFFFFF", fontSize: 12,
                }}
              >
                {labels[item]}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange(value.filter((x) => x !== item)); }}
                  className="flex items-center justify-center flex-shrink-0"
                >
                  <X size={12} color="#FFFFFF" />
                </button>
              </span>
            ))
          ) : (
            <span style={{ fontSize: 14, color: "#6B5DAA" }}>{placeholder}</span>
          )}
        </div>
        <span className="flex-shrink-0 ml-2">
          {open ? <ChevronUp size={18} color="#7B2FFF" /> : <ChevronDown size={18} color="#7B2FFF" />}
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="flex flex-col gap-[14px] rounded-[14px]"
          style={{
            background: "#1A1240", border: "1.5px solid #2D1B6B",
            padding: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
          }}
        >
          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-[10px]"
            style={{
              background: "#0F0A2E", border: "1px solid #2D1B6B",
              height: 36, padding: "0 10px",
            }}
          >
            <Search size={14} color="#6B5DAA" className="flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder ?? "Поиск..."}
              className="flex-1 bg-transparent outline-none text-white placeholder:text-[#6B5DAA]"
              style={{ fontSize: 12 }}
            />
          </div>

          {/* Groups */}
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div key={group.label || "flat"} className="flex flex-col gap-2">
                {showGroupHeaders && (
                  <span
                    className="font-semibold uppercase"
                    style={{ fontSize: 11, color: "#9B8FD0", letterSpacing: "0.5px" }}
                  >
                    {group.emoji && `${group.emoji} `}{group.label}
                  </span>
                )}
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => {
                    const selected = value.includes(item);
                    const maxed = !!max && value.length >= max && !selected;
                    return (
                      <button
                        key={item}
                        type="button"
                        disabled={maxed}
                        onClick={() => toggle(item)}
                        className="inline-flex items-center transition-all disabled:opacity-40"
                        style={{
                          borderRadius: 15, height: 30, padding: "0 10px", fontSize: 12, gap: 4,
                          fontWeight: selected ? 600 : 500,
                          background: selected
                            ? "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)"
                            : "#1C1740",
                          color: "#FFFFFF",
                          border: selected ? "none" : "1.5px solid #2D1B6B",
                        }}
                      >
                        {selected && <Check size={11} color="#FFFFFF" className="flex-shrink-0" />}
                        {labels[item]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <span className="text-center py-2" style={{ fontSize: 12, color: "#6B5DAA" }}>
              Ничего не найдено
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── UI primitives ─────────────────────────────────────────────────────────────

function SideNavItem({
  icon,
  label,
  href,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[12px] px-3 h-12 transition-all"
      style={active ? { background: "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)" } : {}}
    >
      <span style={{ color: active ? "#FFFFFF" : "#9B8EC4" }}>{icon}</span>
      <span style={{ color: active ? "#FFFFFF" : "#9B8EC4", fontWeight: active ? 600 : 500, fontSize: 14 }}>
        {label}
      </span>
    </Link>
  );
}

function BottomTab({
  icon,
  label,
  href,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-1 px-6 py-2">
      <span style={{ color: active ? "#7B2FFF" : "#9B8EC4" }}>{icon}</span>
      <span className="font-semibold" style={{ fontSize: 10, color: active ? "#7B2FFF" : "#9B8EC4" }}>
        {label}
      </span>
    </Link>
  );
}

function SectionHeader({ label, size = 16 }: { label: string; size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-shrink-0"
        style={{
          width: 3, height: 18, borderRadius: 2,
          background: "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)",
        }}
      />
      <span className="font-bold" style={{ fontSize: size, color: "#FFFFFF" }}>{label}</span>
    </div>
  );
}

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-semibold" style={{ fontSize: 14, color: "#FFFFFF" }}>
          {label}
          {required && <span style={{ color: "#FF6B9D" }}> *</span>}
        </span>
        {optional && <span style={{ fontSize: 12, color: "#6B5DAA" }}>необязательно</span>}
      </div>
      {children}
    </div>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return (
    <span className="leading-relaxed" style={{ fontSize: 12, color: "#9B8FD0" }}>
      {children}
    </span>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-white outline-none placeholder:text-[#6B5DAA]"
      style={{
        background: "#1C1740", border: "1.5px solid #2D1B6B",
        borderRadius: 14, height: 52, padding: "0 16px", fontSize: 14,
      }}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full text-white outline-none placeholder:text-[#6B5DAA] resize-none"
      style={{
        background: "#1C1740", border: "1.5px solid #2D1B6B",
        borderRadius: 14, padding: "13px 16px", fontSize: 14,
      }}
    />
  );
}

function FeatureChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-semibold transition-all"
      style={{
        borderRadius: 17, height: 34, padding: "0 12px", fontSize: 12,
        background: active ? "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)" : "#1C1740",
        color: active ? "#FFFFFF" : "#9B8EC4",
        border: active ? "none" : "1.5px solid #2D1B6B",
      }}
    >
      {label}
    </button>
  );
}

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  const lightColors = ["#e8d8b0", "#b89968", "#7eb6d8"];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center rounded-full flex-shrink-0 transition-all"
      style={{
        width: 40, height: 40, background: color,
        border: selected ? "none" : "1.5px solid #2D1B6B",
        boxShadow: selected ? "0 0 0 2px #7B2FFF" : "none",
        outline: selected ? "2px solid transparent" : "none",
      }}
    >
      {selected && <Check size={16} color={lightColors.includes(color) ? "#333" : "#fff"} />}
    </button>
  );
}
