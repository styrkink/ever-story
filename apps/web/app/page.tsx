"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-[#8B5CF6]/30 text-[#1A0A2E]">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Examples />
      <Reviews />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <header className="w-full h-[72px] bg-[#1A0A2E] px-6 lg:px-[80px] flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 text-[#FFFFFF] text-[20px] font-bold">
        <span className="text-[18px]">⊹</span> EverStory
      </Link>
      <nav className="hidden lg:flex items-center gap-[32px]">
        <Link href="#examples" className="text-[#BBA8D8] text-[15px] hover:text-white transition-colors">Примеры</Link>
        <Link href="#how-it-works" className="text-[#BBA8D8] text-[15px] hover:text-white transition-colors">Как это работает</Link>
        <Link href="#reviews" className="text-[#BBA8D8] text-[15px] hover:text-white transition-colors">Отзывы</Link>
        <Link href="#faq" className="text-[#BBA8D8] text-[15px] hover:text-white transition-colors">FAQ</Link>
        <div className="w-[1px] h-[20px] bg-[#4A2F6E]" />
        <Link href="/login" className="px-[20px] py-[9px] rounded-[8px] border border-[#6D3FA8] text-[#C9B0E8] text-[14px] hover:bg-[#6D3FA8]/20 transition-colors">
          Войти
        </Link>
        <Link href="/register" className="px-[20px] py-[9px] rounded-[8px] bg-[#8B5CF6] text-white text-[14px] font-semibold hover:bg-[#7C4DED] transition-colors">
          Начать бесплатно
        </Link>
      </nav>
      {/* Mobile nav */}
      <div className="flex lg:hidden">
        <Link href="/register" className="px-[16px] py-[8px] rounded-[8px] bg-[#8B5CF6] text-white text-[14px] font-semibold">
          Начать
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="w-full bg-gradient-to-br from-[#1A0A2E] via-[#2D1060] to-[#1A0A2E] flex flex-col lg:flex-row">
      {/* Mobile: image on top */}
      <div className="block lg:hidden w-full h-[280px] relative">
        <Image
          src="/images/generated-1776215336307.png"
          alt="Волшебная сказка"
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1A0A2E]" />
      </div>

      {/* Left content */}
      <div className="flex-1 px-6 lg:pl-[80px] lg:pr-0 py-10 lg:py-[80px] flex flex-col justify-center gap-[24px] z-10 lg:max-w-[660px]">
        <div className="bg-[#2D1060] rounded-[20px] px-[14px] py-[6px] w-fit">
          <span className="text-[#D4B0FF] text-[13px]">✨ Для особых семейных моментов</span>
        </div>
        <h1 className="text-white text-[36px] lg:text-[46px] font-bold leading-[1.2]">
          Создавай волшебные сказки для своих детей
        </h1>
        <p className="text-[#C9B0E8] text-[16px] lg:text-[17px] leading-[1.6] lg:max-w-[460px]">
          Персонализированные истории с вашим ребёнком в главной роли. Укажи имя, интересы — и получи уникальную сказку за 5 минут.
        </p>
        <div className="flex flex-col sm:flex-row gap-[12px]">
          <button className="px-[24px] py-[14px] bg-[#F59E0B] text-[#1A0A2E] text-[16px] font-bold rounded-[10px] hover:bg-[#e8920a] transition-colors w-full sm:w-auto text-center">
            Создать сказку бесплатно
          </button>
          <button className="px-[24px] py-[14px] rounded-[10px] border border-white/40 text-white text-[16px] hover:bg-white/5 transition-colors w-full sm:w-auto text-center">
            ▶ Посмотреть пример
          </button>
        </div>
        <div className="flex items-center gap-0 pt-2">
          <div className="flex flex-col gap-[2px] flex-1">
            <span className="text-[#F59E0B] text-[20px] font-bold">10 000+</span>
            <span className="text-[#BBA8D8] text-[12px]">семей уже создали сказки</span>
          </div>
          <div className="w-[1px] h-[36px] bg-[#4A2F6E]" />
          <div className="flex flex-col gap-[2px] flex-1 pl-6">
            <span className="text-[#F59E0B] text-[20px] font-bold">~3 мин</span>
            <span className="text-[#BBA8D8] text-[12px]">на создание истории</span>
          </div>
          <div className="w-[1px] h-[36px] bg-[#4A2F6E]" />
          <div className="flex flex-col gap-[2px] flex-1 pl-6">
            <span className="text-[#F59E0B] text-[20px] font-bold">4.9 ★</span>
            <span className="text-[#BBA8D8] text-[12px]">средний рейтинг</span>
          </div>
        </div>
      </div>

      {/* Right image — desktop only */}
      <div className="hidden lg:block flex-1 relative min-h-[680px]">
        <Image
          src="/images/generated-1776215336307.png"
          alt="Волшебная сказка"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A0A2E] via-transparent to-transparent w-[200px]" />
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: 1,
      color: "#F59E0B",
      textColor: "#1A0A2E",
      title: "Создай персонажей",
      desc: "Ребёнок, питомец или оба — заполни профиль с именем и увлечениями. Укажи имя, возраст и любимые темы, чем больше подробностей — тем живее история.",
    },
    {
      n: 2,
      color: "#8B5CF6",
      textColor: "#FFFFFF",
      title: "Настрой сказку",
      desc: "Выбери тему, длину истории, стиль иллюстраций и моральный урок. Добавь любые дополнительные пожелания — особые детали, которые сделают сказку по-настоящему уникальной.",
    },
    {
      n: 3,
      color: "#EC4899",
      textColor: "#FFFFFF",
      title: "ИИ создаёт историю",
      desc: "Наш ИИ генерирует уникальный текст и иллюстрации за ~3 минуты. Каждая история персонализирована и больше нигде не повторяется.",
    },
    {
      n: 4,
      color: "#10B981",
      textColor: "#FFFFFF",
      title: "Наслаждайся и сохраняй",
      desc: "Читай готовую сказку прямо в браузере, скачай PDF или закажи красивый печатный вариант — красочную физическую книгу, которая останется у ребёнка навсегда.",
    },
  ];

  return (
    <section id="how-it-works" className="w-full bg-gradient-to-br from-[#1A0A2E] to-[#2D0F55] py-[72px] px-6 lg:px-[80px]">
      <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-[52px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <h2 className="text-white text-[32px] lg:text-[36px] font-bold">Как происходит магия</h2>
          <p className="text-[#C9B0E8] text-[16px]">Пошаговый процесс от идеи до готовой сказки</p>
        </div>

        <div className="w-full flex flex-col lg:flex-row items-center gap-[60px] lg:gap-[80px]">
          <div className="flex-1 flex flex-col gap-[36px]">
            {steps.map((step) => (
              <div key={step.n} className="flex gap-[20px]">
                <div
                  className="w-[44px] h-[44px] rounded-full flex-shrink-0 flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: step.color }}
                >
                  <span className="text-[18px] font-bold" style={{ color: step.textColor }}>{step.n}</span>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <h3 className="text-white text-[18px] font-bold">{step.title}</h3>
                  <p className="text-[#C9B0E8] text-[14px] leading-[1.65] max-w-[460px]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full lg:w-[420px] h-[280px] lg:h-[420px] rounded-[20px] overflow-hidden relative shadow-2xl shadow-[#8B5CF6]/20 flex-shrink-0">
            <Image src="/images/generated-1776215244182.png" alt="Как создаётся сказка" fill className="object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Examples() {
  const stories = [
    { img: "/images/generated-1776211596244.png", title: "🏰 Принцесса Ариша и Волшебный Лес", meta: "Для Арины, 5 лет · Приключения" },
    { img: "/images/generated-1776211616081.png", title: "🚀 Космонавт Лёша и Планета Динозавров", meta: "Для Алексея, 7 лет · Фантастика" },
    { img: "/images/generated-1776211634000.png", title: "🦄 Маша и Единорог из Радужной Долины", meta: "Для Маши, 4 года · Волшебная сказка" },
  ];

  return (
    <section id="examples" className="w-full bg-white py-[72px] px-6 lg:px-[80px]">
      <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-[48px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <h2 className="text-[#1A0A2E] text-[32px] lg:text-[36px] font-bold">Примеры готовых сказок</h2>
          <p className="text-[#6B5B8A] text-[16px]">Посмотри, какие истории уже создали другие семьи</p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-[24px]">
          {stories.map((s, i) => (
            <div key={i} className="bg-white rounded-[16px] border border-[#E8D5FF] overflow-hidden flex flex-col cursor-pointer hover:shadow-lg hover:shadow-purple-100 transition-shadow">
              <div className="w-full h-[200px] relative">
                <Image src={s.img} alt={s.title} fill className="object-cover" />
              </div>
              <div className="p-[20px] flex flex-col gap-[6px]">
                <h3 className="text-[#1A0A2E] text-[15px] font-bold leading-[1.4]">{s.title}</h3>
                <p className="text-[#8B7BA8] text-[13px]">{s.meta}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full bg-[#8B5CF6] rounded-[16px] px-[28px] lg:px-[36px] py-[24px] flex flex-col sm:flex-row items-center justify-between gap-[20px]">
          <span className="text-white text-[18px] lg:text-[20px] font-bold text-center sm:text-left">
            🎁 Первые 7 дней — бесплатно!
          </span>
          <button className="bg-white px-[24px] py-[12px] rounded-[8px] text-[#8B5CF6] text-[15px] font-bold hover:bg-gray-50 transition-colors flex-shrink-0">
            Попробовать сейчас
          </button>
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  const reviews = [
    {
      text: "«Мой сын в восторге! Мы создали сказку про него и его любимых динозавров. Он просит читать её каждый вечер. Спасибо EverStory!»",
      abbr: "АС",
      bg: "#8B5CF6",
      name: "Анна Смирнова",
      role: "Мама Дениса, 6 лет",
    },
    {
      text: "«Идеальный подарок для ребёнка! Создала персонализированную сказку про дочку — она была так рада увидеть себя в главной роли. Очень рекомендую!»",
      abbr: "МК",
      bg: "#EC4899",
      name: "Мария Козлова",
      role: "Мама Сони, 4 года",
    },
    {
      text: "«Невероятный сервис! Создали целую книгу про нашу семью. Иллюстрации красивые, текст добрый и интересный. Дети требуют новые истории каждую неделю!»",
      abbr: "ДП",
      bg: "#F59E0B",
      name: "Дмитрий Петров",
      role: "Папа двух детей, 5 и 8 лет",
    },
  ];

  const [active, setActive] = useState(0);

  return (
    <section id="reviews" className="w-full bg-[#F8F5FF] py-[72px] px-6 lg:px-[80px]">
      <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-[48px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <h2 className="text-[#1A0A2E] text-[32px] lg:text-[36px] font-bold">Что говорят родители</h2>
          <p className="text-[#6B5B8A] text-[16px]">Более 10 000 семей уже создали свои первые сказки</p>
        </div>

        {/* Desktop: 3 cards */}
        <div className="hidden lg:grid w-full grid-cols-3 gap-[24px]">
          {reviews.map((r, i) => (
            <ReviewCard key={i} r={r} />
          ))}
        </div>

        {/* Mobile: single card carousel */}
        <div className="flex lg:hidden w-full flex-col items-center gap-[24px]">
          <ReviewCard r={reviews[active]} />
          <div className="flex items-center gap-[20px]">
            <button
              onClick={() => setActive((prev) => (prev - 1 + reviews.length) % reviews.length)}
              className="w-[40px] h-[40px] rounded-full border border-[#E8D5FF] flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronLeft size={18} className="text-[#6B5B8A]" />
            </button>
            <div className="flex gap-[8px]">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-[8px] h-[8px] rounded-full transition-colors ${i === active ? "bg-[#8B5CF6]" : "bg-[#D4C5F0]"}`}
                />
              ))}
            </div>
            <button
              onClick={() => setActive((prev) => (prev + 1) % reviews.length)}
              className="w-[40px] h-[40px] rounded-full bg-[#8B5CF6] flex items-center justify-center hover:bg-[#7C4DED] transition-colors"
            >
              <ChevronRight size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ r }: { r: { text: string; abbr: string; bg: string; name: string; role: string } }) {
  return (
    <div className="bg-white rounded-[16px] border border-[#E8D5FF] p-[24px] flex flex-col gap-[16px] shadow-sm w-full">
      <div className="text-[#F59E0B] text-[18px] tracking-wide">★★★★★</div>
      <p className="text-[#3D2870] text-[15px] leading-[1.65] flex-1">{r.text}</p>
      <div className="flex items-center gap-[12px]">
        <div
          className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
          style={{ backgroundColor: r.bg }}
        >
          {r.abbr}
        </div>
        <div className="flex flex-col gap-[2px]">
          <span className="text-[#1A0A2E] text-[14px] font-semibold">{r.name}</span>
          <span className="text-[#8B7BA8] text-[12px]">{r.role}</span>
        </div>
      </div>
    </div>
  );
}

function Pricing() {
  const freeFeatures = [
    { text: "1 история в месяц", active: true },
    { text: "3 шаблона на выбор", active: true },
    { text: "Базовые иллюстрации", active: true },
    { text: "PDF · история по фото", active: false },
  ];

  const basicFeatures = [
    { text: "15 историй в месяц", active: true },
    { text: "Все шаблоны и темы", active: true },
    { text: "PDF экспорт", active: true },
    { text: "История по фото ребёнка", active: true },
    { text: "До 2 профилей детей", active: true },
  ];

  const premiumFeatures = [
    { text: "Безлимитные истории", active: true },
    { text: "Все функции Basic", active: true },
    { text: "До 5 профилей детей", active: true },
    { text: "Приоритетная генерация", active: true },
    { text: "Голосовое сопровождение (скоро)", active: false },
  ];

  return (
    <section id="pricing" className="w-full bg-[#F8F5FF] py-[72px] px-6 lg:px-[80px]">
      <div className="max-w-[1100px] mx-auto flex flex-col items-center gap-[48px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <h2 className="text-[#1A0A2E] text-[32px] lg:text-[36px] font-bold">Выбери свой план</h2>
          <p className="text-[#6B5B8A] text-[16px]">Начни бесплатно — платная подписка без скрытых условий</p>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-[24px] items-start">
          {/* Free */}
          <div className="bg-white rounded-[20px] border border-[#E8D5FF] p-[28px] flex flex-col gap-[20px]">
            <div>
              <div className="text-[#1A0A2E] text-[16px] font-semibold">🌱 Free</div>
              <div className="text-[#8B7BA8] text-[13px] mt-[2px]">Для всех попробовать</div>
            </div>
            <div className="flex items-end gap-[4px]">
              <span className="text-[#1A0A2E] text-[30px] font-bold">Бесплатно</span>
            </div>
            <div className="flex flex-col gap-[10px] flex-1">
              {freeFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-[8px]">
                  <span className={`text-[14px] font-semibold ${f.active ? "text-[#8B5CF6]" : "text-[#D4C5F0]"}`}>✓</span>
                  <span className={`text-[14px] ${f.active ? "text-[#3D2870]" : "text-[#C4B5D8] line-through"}`}>{f.text}</span>
                </div>
              ))}
            </div>
            <button className="w-full py-[12px] rounded-[10px] border border-[#8B5CF6] text-[#8B5CF6] text-[15px] font-semibold hover:bg-purple-50 transition-colors mt-2">
              Начать бесплатно
            </button>
          </div>

          {/* Basic — popular */}
          <div className="bg-gradient-to-b from-[#6D28D9] to-[#4C1D95] rounded-[20px] p-[28px] flex flex-col gap-[20px] relative shadow-2xl shadow-[#8B5CF6]/30 lg:-mt-4 lg:mb-[-4px]">
            <div className="absolute -top-[14px] left-1/2 -translate-x-1/2">
              <span className="bg-[#F59E0B] text-[#1A0A2E] text-[12px] font-bold px-[14px] py-[5px] rounded-full whitespace-nowrap shadow">
                ⭐ Популярный
              </span>
            </div>
            <div>
              <div className="text-white text-[16px] font-semibold">✨ Basic</div>
              <div className="text-[#C9B0E8] text-[13px] mt-[2px]">Для активных создателей</div>
            </div>
            <div className="flex items-end gap-[4px]">
              <span className="text-white text-[32px] font-bold">$6.99</span>
              <span className="text-[#C9B0E8] text-[14px] mb-[6px]">/мес</span>
            </div>
            <div className="flex flex-col gap-[10px] flex-1">
              {basicFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-[8px]">
                  <span className="text-[#A78BFA] text-[14px] font-semibold">✓</span>
                  <span className="text-[#E9D5FF] text-[14px]">{f.text}</span>
                </div>
              ))}
            </div>
            <button className="w-full py-[13px] rounded-[10px] bg-[#F59E0B] text-[#1A0A2E] text-[15px] font-bold hover:bg-[#e8920a] transition-colors mt-2 shadow-lg">
              Попробовать 7 дней бесплатно
            </button>
          </div>

          {/* Premium */}
          <div className="bg-white rounded-[20px] border border-[#E8D5FF] p-[28px] flex flex-col gap-[20px]">
            <div>
              <div className="text-[#1A0A2E] text-[16px] font-semibold">👑 Premium</div>
              <div className="text-[#8B7BA8] text-[13px] mt-[2px]">Для всей семьи</div>
            </div>
            <div className="flex items-end gap-[4px]">
              <span className="text-[#1A0A2E] text-[30px] font-bold">$12.99</span>
              <span className="text-[#8B7BA8] text-[14px] mb-[6px]">/мес</span>
            </div>
            <div className="flex flex-col gap-[10px] flex-1">
              {premiumFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-[8px]">
                  <span className={`text-[14px] font-semibold ${f.active ? "text-[#8B5CF6]" : "text-[#D4C5F0]"}`}>✓</span>
                  <span className={`text-[14px] ${f.active ? "text-[#3D2870]" : "text-[#C4B5D8]"}`}>{f.text}</span>
                </div>
              ))}
            </div>
            <button className="w-full py-[12px] rounded-[10px] border border-[#8B5CF6] text-[#8B5CF6] text-[15px] font-semibold hover:bg-purple-50 transition-colors mt-2">
              Начать с Premium
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Как долго создаётся сказка?",
      a: "Обычно ~3 минуты. Скорость зависит от длины истории и выбранного плана. В плане Premium — приоритетная очередь.",
    },
    {
      q: "Для какого возраста подходят сказки?",
      a: "EverStory создаёт истории для детей от 3 до 12 лет. Вы выбираете возраст, и ИИ адаптирует язык, сложность и сюжет под ребёнка.",
    },
    {
      q: "Могу ли я редактировать готовую сказку?",
      a: "Да! После генерации вы можете отредактировать текст, поменять имена персонажей, добавить или убрать детали прямо в редакторе.",
    },
    {
      q: "Можно ли распечатать и получить физическую книгу?",
      a: "Да! В планах Basic и Premium доступен PDF высокого качества (300 DPI) для самостоятельной печати в формате А4 или А5. Также можно заказать готовую печатную книгу в твёрдой обложке через приложение.",
    },
    {
      q: "Как доставляется печатная книга?",
      a: "После оформления заказа мы передаём книгу в печатный сервис Lulu — один из крупнейших мировых провайдеров печати (по предоплате). Lulu печатает книгу в твёрдой обложке и доставляет напрямую в одни двери. Сроки доставки зависят от страны и обычно составляют 5–10 рабочих дней.",
    },
    {
      q: "Есть ли бесплатный пробный период?",
      a: "Да! Вы получаете 1 сказку бесплатно без регистрации карты. Для плана Basic — 7 дней пробного периода со всеми функциями.",
    },
  ];

  return (
    <section id="faq" className="w-full bg-white py-[72px] px-6 lg:px-[80px]">
      <div className="max-w-[860px] mx-auto flex flex-col items-center gap-[48px]">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <h2 className="text-[#1A0A2E] text-[32px] lg:text-[36px] font-bold">Часто задаваемые вопросы</h2>
          <p className="text-[#6B5B8A] text-[16px]">Наши ответы на главные вопросы родителей</p>
        </div>

        <div className="w-full flex flex-col">
          {faqs.map((f, i) => (
            <div key={i} className="flex flex-col">
              <div className="py-[22px] flex flex-col gap-[10px]">
                <h3 className="text-[#1A0A2E] text-[16px] font-bold">{f.q}</h3>
                <p className="text-[#6B5B8A] text-[14px] leading-[1.65]">{f.a}</p>
              </div>
              {i < faqs.length - 1 && <div className="w-full h-[1px] bg-[#EDE8F7]" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="w-full bg-gradient-to-br from-[#2D0F55] via-[#1A0A2E] to-[#3B1278] py-[80px] px-6 lg:px-[80px] flex flex-col items-center gap-[24px]">
      <h2 className="text-white text-[32px] lg:text-[40px] font-bold text-center leading-[1.2]">
        Готов создать первую сказку?
      </h2>
      <p className="text-[#C9B0E8] text-[16px] leading-[1.6] max-w-[560px] text-center">
        Присоединяйся к 10 000+ семей, которые уже создают волшебные воспоминания вместе с EverStory
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-[14px] mt-2 w-full sm:w-auto">
        <button className="px-[32px] py-[15px] bg-[#F59E0B] text-[#1A0A2E] text-[17px] font-bold rounded-[12px] hover:bg-[#e8920a] transition-colors w-full sm:w-auto">
          Начать бесплатно
        </button>
        <button className="px-[32px] py-[15px] border border-white/40 text-white text-[17px] rounded-[12px] hover:bg-white/5 transition-colors w-full sm:w-auto">
          Смотреть примеры
        </button>
      </div>
      <p className="text-[#8B6BAE] text-[13px] text-center">
        Бесплатно · Без кредитной карты · Первая сказка в подарок
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-[#0F0720]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[80px] pt-[48px] pb-[32px] flex flex-col lg:flex-row gap-[48px] lg:gap-[80px]">
        <div className="flex flex-col gap-[14px] lg:w-[280px]">
          <span className="text-white text-[18px] font-bold flex items-center gap-2">
            <span>⊹</span> EverStory
          </span>
          <p className="text-[#6B5B8A] text-[14px] leading-[1.65]">
            Создавай персонализированные сказки для своих детей с помощью ИИ.
          </p>
        </div>

        <div className="flex gap-[60px] lg:gap-[80px]">
          <div className="flex flex-col gap-[10px]">
            <span className="text-white text-[13px] font-semibold mb-1">Продукт</span>
            <Link href="#examples" className="text-[#6B5B8A] text-[14px] hover:text-[#BBA8D8] transition-colors">Примеры сказок</Link>
            <Link href="#how-it-works" className="text-[#6B5B8A] text-[14px] hover:text-[#BBA8D8] transition-colors">Как это работает</Link>
            <Link href="#pricing" className="text-[#6B5B8A] text-[14px] hover:text-[#BBA8D8] transition-colors">Цены</Link>
          </div>
          <div className="flex flex-col gap-[10px]">
            <span className="text-white text-[13px] font-semibold mb-1">Компания</span>
            <Link href="#" className="text-[#6B5B8A] text-[14px] hover:text-[#BBA8D8] transition-colors">О нас</Link>
            <Link href="#" className="text-[#6B5B8A] text-[14px] hover:text-[#BBA8D8] transition-colors">Блог</Link>
            <Link href="#" className="text-[#6B5B8A] text-[14px] hover:text-[#BBA8D8] transition-colors">Поддержка</Link>
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-[#FFFFFF1A]" />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-[80px] py-[20px] flex flex-col sm:flex-row items-center justify-between gap-[12px]">
        <span className="text-[#4A3A6A] text-[13px]">© 2025 EverStory. Все права защищены.</span>
        <span className="text-[#4A3A6A] text-[13px]">Политика конфиденциальности · Условия использования</span>
      </div>
    </footer>
  );
}
