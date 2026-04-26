"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  House, BookOpen, User, Sparkles, Bell, Plus,
  RefreshCw, ShieldCheck, X, Check, UserPlus,
} from "lucide-react";
import {
  getChildren, getStories, calcAge,
  AuthError, ApiError,
  type Child, type Story,
} from "@/lib/api";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Доброй ночи! 🌙";
  if (h < 12) return "Доброе утро! ☀️";
  if (h < 17) return "Добрый день! 👋";
  return "Добрый вечер! 🌙";
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function avatarGradient(name: string) {
  const g = [
    "linear-gradient(135deg, #7B2FFF 0%, #FF6B9D 100%)",
    "linear-gradient(135deg, #4F46E5 0%, #7B2FFF 100%)",
    "linear-gradient(135deg, #FF6B9D 0%, #FFB703 100%)",
    "linear-gradient(135deg, #06B6D4 0%, #4F46E5 100%)",
  ];
  return g[(name.charCodeAt(0) ?? 0) % g.length];
}

export default function HomePage() {
  const router   = useRouter();
  const greeting = getGreeting();

  const [children,       setChildren]       = useState<Child[]>([]);
  const [stories,        setStories]        = useState<Story[]>([]);
  const [loadingKids,    setLoadingKids]    = useState(true);
  const [loadingStories, setLoadingStories] = useState(true);
  const [kidsError,      setKidsError]      = useState<string | null>(null);
  const [storiesError,   setStoriesError]   = useState<string | null>(null);
  const [coppaRequired,  setCoppaRequired]  = useState(false);
  const [coppaModal,     setCoppaModal]     = useState(false);

  useEffect(() => {
    getChildren()
      .then(setChildren)
      .catch((err) => {
        if (err instanceof AuthError)                         router.replace("/login");
        else if (err instanceof ApiError && err.statusCode === 403) setCoppaRequired(true);
        else setKidsError("Не удалось загрузить профили");
      })
      .finally(() => setLoadingKids(false));

    getStories()
      .then(setStories)
      .catch((err) => {
        if (err instanceof AuthError) router.replace("/login");
        else setStoriesError("Не удалось загрузить истории");
      })
      .finally(() => setLoadingStories(false));
  }, [router]);

  const recentStories = [...stories]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const totalStories = stories.length;
  const storiesEmpty = !loadingStories && !storiesError && recentStories.length === 0;
  const kidsEmpty    = !loadingKids   && !kidsError   && !coppaRequired && children.length === 0;

  return (
    <div className="min-h-screen flex font-sans" style={{ background: "#0F0A2E" }}>

      {/* ── SIDEBAR — desktop only ── */}
      <aside
        className="hidden lg:flex flex-col justify-between flex-shrink-0"
        style={{ width: 240, background: "#080617" }}
      >
        <div className="flex flex-col gap-2">
          <div className="px-6 pt-8 pb-5">
            <span className="text-white text-[20px] font-bold">✨ EverStory</span>
          </div>
          <nav className="flex flex-col gap-1 px-3">
            <NavItem icon={<House size={18} />} label="Главная" active />
            <NavItem icon={<BookOpen size={18} />} label="Истории" />
            <NavItem icon={<User size={18} />} label="Профиль" />
          </nav>
        </div>
        <div className="flex items-center gap-3 px-4 py-5" style={{ background: "#0D0A24" }}>
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-[16px] text-white"
            style={{
              width: 40, height: 40,
              background: children[0] ? avatarGradient(children[0].name) : "#2D1B6B",
            }}
          >
            {children[0] ? initials(children[0].name) : <User size={18} color="#9B8EC4" />}
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="text-white text-[13px] font-semibold truncate">Мой профиль</span>
            <span className="text-[#9B8EC4] text-[11px] truncate">
              {children.length} {children.length === 1 ? "ребёнок" : "детей"} · {totalStories} историй
            </span>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Top bar — desktop */}
        <header
          className="hidden lg:flex items-center justify-between flex-shrink-0 px-10"
          style={{ height: 72, background: "#080617", borderBottom: "1px solid #1A1050" }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[#9B8EC4] text-[12px]">{greeting}</span>
            <span className="text-white text-[18px] font-bold">Добро пожаловать в EverStory</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="flex items-center justify-center rounded-full"
              style={{ width: 40, height: 40, background: "#1A1050" }}
            >
              <Bell size={18} color="#9B8EC4" />
            </button>
            <button
              className="flex items-center gap-2 rounded-[20px] px-5 py-[10px] text-[#0F0A2E] text-[14px] font-bold"
              style={{ background: "#FFB703" }}
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
          <span className="text-white font-bold" style={{ fontSize: 16 }}>✨ EverStory</span>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center justify-center rounded-full"
              style={{ width: 34, height: 34, background: "#1A1050" }}
            >
              <Bell size={15} color="#9B8EC4" />
            </button>
            <button
              className="flex items-center gap-[5px] rounded-[17px] px-3 py-2 text-[#0F0A2E] text-[12px] font-bold"
              style={{ background: "#FFB703" }}
            >
              <Sparkles size={12} color="#0F0A2E" />
              Создать
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">

            <div className="px-5 lg:px-10 pb-24 lg:pb-10 flex flex-col gap-6 lg:gap-8 pt-5 lg:pt-9">

            {/* ── HERO CARD ── */}
            <div className="relative overflow-hidden rounded-[24px] h-[200px] lg:h-[220px]">
              <Image src="/images/generated-1775938412647.png" alt="" fill className="object-cover" priority />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, #3B1FA8 0%, #7B2FFF 50%, #1A1050 100%)", opacity: 0.7 }}
              />
              <div className="absolute flex flex-col gap-2" style={{ left: 20, top: 24 }}>
                <p className="text-white font-bold leading-snug lg:text-[26px]" style={{ fontSize: 20, maxWidth: 300 }}>
                  Создай сказку за 90 секунд ✨
                </p>
                <span className="text-[#C4B5FD] text-[12px] lg:text-[15px]" style={{ maxWidth: 290 }}>
                  Твой ребёнок — главный герой. Магия в одно нажатие.
                </span>
              </div>
              <button
                className="absolute flex items-center gap-2 rounded-[22px] lg:rounded-[24px] px-[18px] py-[10px] lg:px-[22px] lg:py-[12px] text-[#0F0A2E] text-[13px] lg:text-[14px] font-bold"
                style={{ background: "#FFB703", left: 20, bottom: 24 }}
              >
                <Sparkles size={13} color="#0F0A2E" />
                Создать магию
              </button>
            </div>

            {/* ── STORIES SECTION ── */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-white text-[15px] lg:text-[18px] font-bold">Последние истории</span>
                {!storiesEmpty && !loadingStories && !storiesError && (
                  <span className="text-[#9B8EC4] text-[13px] cursor-pointer hover:text-white transition-colors">
                    <span className="lg:hidden">Все →</span>
                    <span className="hidden lg:inline">Все истории →</span>
                  </span>
                )}
              </div>

              {loadingStories ? (
                <StoriesSkeleton />
              ) : storiesError ? (
                <FetchError message={storiesError} />
              ) : storiesEmpty ? (
                <StoriesEmpty />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  {recentStories.map((s) => <StoryCard key={s.id} story={s} />)}
                </div>
              )}
            </section>

            {/* ── CHILDREN SECTION ── */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-white text-[15px] lg:text-[18px] font-bold">Профили детей</span>
                {coppaRequired ? (
                  <div
                    className="flex items-center gap-[5px] lg:gap-[6px] rounded-[14px] lg:rounded-[20px] px-[10px] py-[5px] lg:px-3 lg:py-1.5"
                    style={{ background: "#1A1050", border: "1px solid #FFB703" }}
                  >
                    <ShieldCheck size={13} color="#FFB703" />
                    <span className="text-[#FFB703] text-[10px] lg:text-[11px] font-semibold">Требуется верификация</span>
                  </div>
                ) : kidsEmpty ? (
                  <div
                    className="flex items-center gap-[5px] lg:gap-[6px] rounded-[14px] lg:rounded-[20px] px-[10px] py-[5px] lg:px-3 lg:py-1.5"
                    style={{ background: "#0B2018", border: "1px solid #22C55E" }}
                  >
                    <ShieldCheck size={11} color="#22C55E" className="lg:hidden" />
                    <ShieldCheck size={13} color="#22C55E" className="hidden lg:block" />
                    <span className="font-semibold text-[10px] lg:text-[11px]" style={{ color: "#22C55E" }}>
                      <span className="lg:hidden">COPPA подтверждено</span>
                      <span className="hidden lg:inline">COPPA Подтверждено</span>
                    </span>
                  </div>
                ) : children.length > 0 ? (
                  <button
                    className="flex items-center gap-1.5 rounded-[14px] px-3 py-1.5"
                    style={{ background: "#2D1B6B" }}
                  >
                    <Plus size={14} color="#C4B5FD" />
                    <span className="text-[#C4B5FD] text-[11px] lg:text-[12px]">Добавить ребёнка</span>
                  </button>
                ) : null}
              </div>

              {loadingKids ? (
                <KidsSkeleton />
              ) : kidsError ? (
                <FetchError message={kidsError} />
              ) : coppaRequired ? (
                <CoppaCard onLearnMore={() => setCoppaModal(true)} />
              ) : kidsEmpty ? (
                <KidsEmpty />
              ) : (
                <div className="flex flex-col gap-3">
                  {children.map((child) => {
                    const cs = stories.filter((s) => s.childId === child.id);
                    const cp = cs.reduce((a, s) => a + (s.pages?.length ?? 0), 0);
                    return <ChildCard key={child.id} child={child} storyCount={cs.length} pageCount={cp} />;
                  })}
                </div>
              )}
            </section>

          </div>
        </main>
      </div>

      {coppaModal && <CoppaInfoModal onClose={() => setCoppaModal(false)} />}

      {/* ── BOTTOM TAB BAR — mobile only ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around"
        style={{ height: 72, background: "#080617", borderTop: "1px solid #1A1050" }}
      >
        <BottomTab icon={<House size={20} />} label="Главная" active />
        <BottomTab icon={<BookOpen size={20} />} label="Истории" />
        <BottomTab icon={<User size={20} />} label="Профиль" />
      </nav>
    </div>
  );
}

// ── Reusable layout pieces ──────────────────────────────────────────────────

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div
      className="flex items-center gap-3 rounded-[12px] px-3 h-12 cursor-pointer"
      style={active ? { background: "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)" } : {}}
    >
      <span style={{ color: active ? "#FFFFFF" : "#9B8EC4" }}>{icon}</span>
      <span style={{ color: active ? "#FFFFFF" : "#9B8EC4", fontWeight: active ? 600 : 500, fontSize: 14 }}>
        {label}
      </span>
    </div>
  );
}

function BottomTab({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-2 cursor-pointer">
      <span style={{ color: active ? "#7B2FFF" : "#9B8EC4" }}>{icon}</span>
      <span className="font-semibold" style={{ fontSize: 10, color: active ? "#7B2FFF" : "#9B8EC4" }}>
        {label}
      </span>
    </div>
  );
}

// ── Story card ──────────────────────────────────────────────────────────────

function StoryCard({ story }: { story: Story }) {
  const cover      = story.pages?.find((p) => p.pageNum === 1)?.illustrationUrl;
  const pageCount  = story.pages?.length ?? 0;
  const inProgress = story.status !== "DONE" && story.status !== "FAILED";

  return (
    <div
      className="flex flex-col overflow-hidden rounded-[16px] cursor-pointer hover:opacity-90 transition-opacity"
      style={{ background: "#1A1050", height: 180 }}
    >
      <div className="relative flex-shrink-0" style={{ height: 130 }}>
        {cover ? (
          <Image src={cover} alt={story.theme} fill className="object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3B1FA8 0%, #7B2FFF 50%, #1A1050 100%)" }}
          >
            <Sparkles size={28} color="#C4B5FD" opacity={0.6} />
          </div>
        )}
        {inProgress && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(10,6,30,0.55)" }}>
            <RefreshCw size={18} color="#C4B5FD" className="animate-spin" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 px-3 lg:px-[14px] pt-2.5 pb-2">
        <span className="text-white font-bold leading-snug line-clamp-1 lg:line-clamp-2" style={{ fontSize: 11 }}>
          {story.theme}
        </span>
        <span className="text-[#9B8EC4]" style={{ fontSize: 10 }}>
          {story.child.name} · {pageCount} стр
        </span>
      </div>
    </div>
  );
}

// ── Child card ──────────────────────────────────────────────────────────────

function ChildCard({ child, storyCount, pageCount }: { child: Child; storyCount: number; pageCount: number }) {
  return (
    <div
      className="flex items-center gap-4 lg:gap-5 rounded-[16px] px-4 lg:px-6 py-[14px] lg:py-5"
      style={{ background: "#1A1050" }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold"
        style={{ width: 48, height: 48, fontSize: 20, background: avatarGradient(child.name) }}
      >
        {initials(child.name)}
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-white text-[15px] lg:text-[17px] font-bold">{child.name}</span>
        <span className="text-[#9B8EC4] text-[12px] lg:text-[13px]">
          {calcAge(child.birthDate)} · {storyCount} историй
        </span>
      </div>
      <div className="hidden lg:flex items-center gap-8 flex-shrink-0">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[#7B2FFF] text-[22px] font-bold">{storyCount}</span>
          <span className="text-[#9B8EC4] text-[12px]">историй</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[#FFB703] text-[22px] font-bold">{pageCount}</span>
          <span className="text-[#9B8EC4] text-[12px]">страниц</span>
        </div>
      </div>
    </div>
  );
}

// ── Empty states ────────────────────────────────────────────────────────────

function StoriesEmpty() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[14px] lg:rounded-[16px]"
      style={{ background: "#1A1050", border: "1.5px solid #2D1B6B" }}
    >
      {/* Mobile */}
      <div className="flex lg:hidden flex-col items-center justify-center gap-[10px] w-full px-4 py-[18px]">
        <div
          className="flex items-center justify-center rounded-[20px]"
          style={{ width: 40, height: 40, background: "#2D1B6B" }}
        >
          <BookOpen size={18} color="#7B2FFF" />
        </div>
        <span className="text-[#9B8EC4] text-[13px] font-semibold">Здесь появятся ваши истории</span>
        <span className="text-[11px] text-center" style={{ color: "#4A3B7A" }}>
          Создайте первую сказку — это займёт всего 90 секунд
        </span>
        <button
          className="flex items-center gap-[6px] rounded-[18px] px-4 py-[9px] text-white text-[12px] font-bold"
          style={{ background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)" }}
        >
          <Sparkles size={12} color="#FFFFFF" />
          Создать первую историю
        </button>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex flex-col items-center justify-center gap-3 w-full px-5 pt-5 pb-7">
        <div
          className="flex items-center justify-center rounded-[26px]"
          style={{ width: 52, height: 52, background: "#2D1B6B" }}
        >
          <BookOpen size={24} color="#7B2FFF" />
        </div>
        <span className="text-[#9B8EC4] text-[15px] font-semibold">Здесь появятся ваши истории</span>
        <span className="text-[13px] text-center" style={{ color: "#4A3B7A" }}>
          Создайте первую сказку — это займёт всего 90 секунд
        </span>
        <button
          className="flex items-center gap-2 rounded-[20px] px-5 py-[10px] text-white text-[13px] font-bold mt-1"
          style={{ background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)" }}
        >
          <Sparkles size={15} color="#FFFFFF" />
          Создать первую историю
        </button>
      </div>
    </div>
  );
}

function KidsEmpty() {
  const router = useRouter();
  return (
    <>
      {/* Mobile — matches KF0Rl */}
      <div
        className="flex lg:hidden flex-col gap-3 rounded-[16px] px-4 py-[18px]"
        style={{ background: "#1A1050", border: "1.5px solid #1A3A2A" }}
      >
        <div className="flex items-center gap-[10px]">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{ width: 40, height: 40, background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)" }}
          >
            <ShieldCheck size={20} color="#FFFFFF" />
          </div>
          <div className="flex flex-col gap-[3px]">
            <span className="text-white font-bold" style={{ fontSize: 14 }}>Верификация пройдена!</span>
            <span style={{ fontSize: 11, color: "#9B8EC4" }}>Аккаунт успешно верифицирован</span>
          </div>
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: "#9B8EC4" }}>
          Теперь вы можете добавить профиль ребёнка и начать создавать персональные сказки.
        </p>
        <button
          className="w-full flex items-center justify-center gap-2 rounded-[22px] py-[11px] text-white text-[13px] font-bold"
          style={{ background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)" }}
          onClick={() => router.push("/add-child")}
        >
          <UserPlus size={14} color="#FFFFFF" />
          Добавить ребёнка
        </button>
      </div>

      {/* Desktop — matches BnBCM: horizontal layout, left=content, right=button */}
      <div
        className="hidden lg:flex items-center gap-7 rounded-[20px] px-8 py-7"
        style={{ background: "#1A1050", border: "1.5px solid #1A3A2A" }}
      >
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{ width: 48, height: 48, background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)" }}
            >
              <ShieldCheck size={22} color="#FFFFFF" />
            </div>
            <div className="flex flex-col gap-[3px]">
              <span className="text-white font-bold" style={{ fontSize: 17 }}>Верификация пройдена!</span>
              <span style={{ fontSize: 13, color: "#9B8EC4" }}>Аккаунт успешно верифицирован</span>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: "#9B8EC4", maxWidth: 540 }}>
            Теперь вы можете добавить профиль ребёнка и начать создавать персональные сказки.
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            className="flex items-center gap-[10px] rounded-[24px] px-7 py-[14px] text-white font-bold whitespace-nowrap"
            style={{ fontSize: 15, background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)" }}
            onClick={() => router.push("/add-child")}
          >
            <UserPlus size={18} color="#FFFFFF" />
            Добавить ребёнка
          </button>
        </div>
      </div>
    </>
  );
}

function CoppaCard({ onLearnMore }: { onLearnMore?: () => void }) {
  const router = useRouter();
  return (
    <>
      {/* Mobile */}
      <div
        className="flex lg:hidden flex-col gap-3 rounded-[16px] p-4"
        style={{ background: "#1A1050", border: "1.5px solid #2D1B6B" }}
      >
        {/* Top row */}
        <div className="flex items-center gap-[10px]">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{ width: 40, height: 40, background: "linear-gradient(135deg, #FFB703 0%, #FF8C00 100%)" }}
          >
            <ShieldCheck size={20} color="#0F0A2E" />
          </div>
          <span className="text-white font-bold" style={{ fontSize: 14 }}>Нет профилей детей</span>
        </div>

        {/* Description */}
        <p className="text-[12px] leading-relaxed" style={{ color: "#9B8EC4" }}>
          Добавьте ребёнка, чтобы начать. Для защиты нужна верификация COPPA.
        </p>

        {/* Verify button */}
        <button
          className="w-full flex items-center justify-center gap-2 rounded-[22px] py-[11px] text-[#0F0A2E] text-[13px] font-bold"
          style={{ background: "linear-gradient(90deg, #FFB703 0%, #FF8C00 100%)" }}
          onClick={() => router.push("/verify-coppa")}
        >
          <ShieldCheck size={14} color="#0F0A2E" />
          Пройти верификацию
        </button>

        {/* Link */}
        <p
          className="text-center text-[12px] font-semibold cursor-pointer"
          style={{ color: "#7B2FFF" }}
          onClick={onLearnMore}
        >
          Узнать о COPPA →
        </p>
      </div>

      {/* Desktop */}
      <div
        className="hidden lg:flex items-center gap-7 rounded-[20px] px-8 py-7"
        style={{ background: "#1A1050", border: "1.5px solid #2D1B6B" }}
      >
        {/* Left */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {/* Icon + heading row */}
          <div className="flex items-center gap-3">
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-[24px]"
              style={{
                width: 48, height: 48,
                background: "linear-gradient(135deg, #FFB703 0%, #FF8C00 100%)",
              }}
            >
              <ShieldCheck size={22} color="#0F0A2E" />
            </div>
            <div className="flex flex-col gap-[3px]">
              <span className="text-white text-[17px] font-bold">Нет профилей детей</span>
              <span className="text-[#9B8EC4] text-[13px]">Добавьте первого ребёнка, чтобы начать</span>
            </div>
          </div>
          {/* Description */}
          <p className="text-[13px] leading-relaxed" style={{ color: "#9B8EC4" }}>
            Для создания профиля ребёнка требуется верификация родителя (COPPA). Это одноразовая процедура, которая занимает 2–3 минуты и защищает данные вашего ребёнка.
          </p>
        </div>

        {/* Right */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <button
            className="flex items-center gap-[10px] rounded-[24px] px-7 py-[14px] text-[#0F0A2E] text-[15px] font-bold whitespace-nowrap"
            style={{ background: "linear-gradient(90deg, #FFB703 0%, #FF8C00 100%)" }}
            onClick={() => router.push("/verify-coppa")}
          >
            <ShieldCheck size={18} color="#0F0A2E" />
            Пройти верификацию
          </button>
          <span
            className="text-[#7B2FFF] text-[12px] font-semibold cursor-pointer hover:underline"
            onClick={onLearnMore}
          >
            Узнать о COPPA →
          </span>
        </div>
      </div>
    </>
  );
}

// ── Loading skeletons ───────────────────────────────────────────────────────

function StoriesSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-[16px] animate-pulse" style={{ height: 180, background: "#1A1050" }} />
      ))}
    </div>
  );
}

function KidsSkeleton() {
  return <div className="rounded-[16px] animate-pulse" style={{ height: 76, background: "#1A1050" }} />;
}

function FetchError({ message }: { message: string }) {
  return (
    <div
      className="rounded-[16px] flex items-center justify-center py-8"
      style={{ background: "#1A1050", border: "1px solid #EF4444" }}
    >
      <span className="text-red-400 text-[13px]">{message}</span>
    </div>
  );
}

// ── COPPA info modal ────────────────────────────────────────────────────────

function CoppaInfoModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      style={{ background: "rgba(10,7,31,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet / modal */}
      <div
        className="w-full lg:w-[520px] flex flex-col rounded-t-[24px] lg:rounded-[24px] overflow-hidden"
        style={{ background: "#1C1740", border: "1.5px solid #2D1B6B", maxHeight: "92dvh" }}
      >
        {/* ── Header ── */}
        <div className="flex flex-col gap-[6px] px-6 pt-6 pb-5 flex-shrink-0">
          {/* Label row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={13} color="#9B8EC4" />
              <span
                className="font-semibold tracking-[1px] uppercase"
                style={{ fontSize: 11, color: "#9B8EC4" }}
              >
                Защита данных
              </span>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 28, height: 28, background: "#2D1B6B" }}
            >
              <X size={14} color="#C4B5FD" />
            </button>
          </div>
          {/* Title */}
          <span className="text-white text-[22px] font-bold leading-snug">
            Почему мы просим верификацию?
          </span>
        </div>

        {/* ── Body (scrollable on mobile) ── */}
        <div className="flex flex-col gap-4 px-6 pb-6 overflow-y-auto">

          {/* Desc block */}
          <div
            className="rounded-[12px] px-4 py-[14px]"
            style={{ background: "#261F4A" }}
          >
            <p className="text-[13px] leading-relaxed" style={{ color: "#C4B5FD" }}>
              Закон COPPA (Children&apos;s Online Privacy Protection Act) обязывает нас получить
              согласие родителя перед созданием аккаунта для ребёнка. Мы делаем это
              единоразово через безопасный платёж в $0.01 — он подтверждает, что вы взрослый.
            </p>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-[14px]">
            <CoppaStep num={1} title="Введите данные карты" desc="Защищённая форма Stripe — мы не храним данные карты" />
            <CoppaStep num={2} title="Спишется $0.01" desc="Символическая сумма для подтверждения возраста родителя" />
            <CoppaStep num={3} title="Аккаунт разблокирован" desc="Создавайте профили детей и заказывайте сказки" green />
          </div>

          {/* Privacy grid */}
          <div
            className="rounded-[12px] px-4 py-[14px] grid grid-cols-2 gap-x-4 gap-y-3"
            style={{ background: "#261F4A" }}
          >
            {[
              "Данные не передаются третьим лицам",
              "Карта не сохраняется",
              "Соответствует COPPA",
              "Можно отменить в любой момент",
            ].map((text) => (
              <div key={text} className="flex items-start gap-2">
                <Check size={12} color="#22C55E" className="flex-shrink-0 mt-[2px]" />
                <span style={{ fontSize: 11, color: "#9B8EC4", lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            className="w-full flex items-center justify-center gap-[10px] rounded-[22px] py-[14px] text-white text-[15px] font-bold"
            style={{
              background: "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)",
              height: 52,
            }}
            onClick={() => { onClose(); router.push("/verify-coppa"); }}
          >
            <ShieldCheck size={18} color="#FFFFFF" />
            Понятно, пройти верификацию
          </button>
        </div>
      </div>
    </div>
  );
}

function CoppaStep({
  num, title, desc, green,
}: {
  num: number; title: string; desc: string; green?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold"
        style={{
          width: 28, height: 28, fontSize: 13,
          background: green ? "#22C55E" : "#7B2FFF",
        }}
      >
        {green ? <Check size={14} color="#fff" /> : num}
      </div>
      <div className="flex flex-col gap-0.5 pt-[2px]">
        <span className="text-white text-[14px] font-semibold">{title}</span>
        <span className="text-[13px]" style={{ color: "#9B8EC4" }}>{desc}</span>
      </div>
    </div>
  );
}
