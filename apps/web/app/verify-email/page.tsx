"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, MailCheck, Timer, Send } from "lucide-react";
import { resendVerificationEmail } from "@/lib/auth";

const RESEND_COOLDOWN = 59;

function getMailUrl(email: string): string {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (domain === "gmail.com") return "https://mail.google.com";
  if (domain === "yahoo.com") return "https://mail.yahoo.com";
  if (domain === "outlook.com" || domain === "hotmail.com" || domain === "live.com")
    return "https://outlook.live.com";
  if (domain === "icloud.com") return "https://www.icloud.com/mail";
  if (domain === "mail.ru") return "https://e.mail.ru";
  if (domain === "yandex.ru" || domain === "ya.ru") return "https://mail.yandex.ru";
  return `mailto:${email}`;
}

const STEPS = [
  "Откройте письмо от EverStory",
  "Нажмите «Подтвердить email» в письме",
  "Вы автоматически попадёте на главную страницу",
];

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [seconds, setSeconds] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (seconds <= 0) {
      setCanResend(true);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  async function handleResend() {
    if (!canResend || resendLoading) return;
    setResendLoading(true);
    setResendError(null);
    try {
      await resendVerificationEmail(email);
      setSeconds(RESEND_COOLDOWN);
      setCanResend(false);
    } catch (err: any) {
      setResendError(err?.message ?? "Не удалось отправить письмо");
    } finally {
      setResendLoading(false);
    }
  }

  const mailUrl = email ? getMailUrl(email) : "mailto:";
  const displayEmail = email || "your@email.com";

  return (
    <>
      {/* ══════════════════════════════════════════════════
          MOBILE  (hidden on lg+)
      ══════════════════════════════════════════════════ */}
      <div
        className="flex lg:hidden flex-col min-h-screen"
        style={{ background: "#0F0A2E" }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-center flex-shrink-0 px-5"
          style={{ height: 64, background: "#100C2A" }}
        >
          <span className="text-white text-[20px] font-bold">✨ EverStory</span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-6 px-6 py-5">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 self-start"
            style={{ color: "#9B8EC4" }}
          >
            <ArrowLeft size={18} />
            <span className="text-[14px]">Назад</span>
          </button>

          {/* Hero */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="flex items-center justify-center rounded-[40px] flex-shrink-0"
              style={{
                width: 80,
                height: 80,
                background: "linear-gradient(135deg, #7B2FFF 0%, #4F46E5 100%)",
              }}
            >
              <MailCheck size={36} color="#FFFFFF" />
            </div>
            <h1 className="text-white text-[26px] font-bold text-center leading-tight">
              Проверьте почту
            </h1>
            <p
              className="text-[#9B8EC4] text-[14px] text-center leading-relaxed"
              style={{ maxWidth: 300 }}
            >
              Мы отправили письмо со ссылкой подтверждения на:
            </p>
          </div>

          {/* Email card */}
          <div
            className="flex items-center justify-center gap-[10px] rounded-[16px] px-5 py-4"
            style={{ background: "#1A1050", border: "1px solid #7B2FFF" }}
          >
            <Mail size={18} color="#C4B5FD" className="flex-shrink-0" />
            <span className="text-[#C4B5FD] text-[16px] font-bold break-all">
              {displayEmail}
            </span>
          </div>

          {/* Steps card */}
          <div
            className="flex flex-col gap-[14px] rounded-[16px] p-5"
            style={{ background: "#0D0820", border: "1px solid #2D1B6B" }}
          >
            <span className="text-white text-[14px] font-bold">
              Что делать дальше?
            </span>
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center flex-shrink-0 text-white text-[12px] font-bold rounded-[12px]"
                  style={{ width: 24, height: 24, background: "#7B2FFF" }}
                >
                  {i + 1}
                </div>
                <span className="text-[#9B8EC4] text-[13px] leading-snug">
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* TTL */}
          <div className="flex items-center justify-center gap-2">
            <Timer size={14} color="#FFB703" />
            <span className="text-[#FFB703] text-[13px] font-semibold">
              Ссылка действует 24 часа
            </span>
          </div>
        </div>

        {/* Fixed bottom section */}
        <div
          className="flex flex-col gap-4 px-6 pb-8 pt-3 flex-shrink-0"
          style={{ borderTop: "1px solid #1A1050" }}
        >
          <a
            href={mailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-[10px] rounded-[28px] text-white text-[16px] font-bold"
            style={{
              height: 56,
              background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)",
            }}
          >
            <Send size={18} />
            Открыть почту
          </a>

          <div className="flex flex-col gap-[10px]">
            {!canResend && (
              <div className="flex items-center justify-center gap-[6px]">
                <Timer size={14} color="#9B8EC4" />
                <span className="text-[#9B8EC4] text-[13px]">
                  Повторная отправка через:{" "}
                  <span className="font-semibold">{seconds} сек.</span>
                </span>
              </div>
            )}
            {resendError && (
              <p className="text-red-400 text-[12px] text-center">{resendError}</p>
            )}
            <div className="flex items-center justify-center gap-[6px]">
              <span className="text-[#9B8EC4] text-[13px]">
                Не получили письмо?{" "}
              </span>
              <button
                onClick={handleResend}
                disabled={!canResend || resendLoading}
                className="text-[#C4B5FD] text-[13px] font-semibold disabled:opacity-40"
              >
                {resendLoading ? "Отправка…" : "Отправить снова"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          DESKTOP  (hidden below lg)
      ══════════════════════════════════════════════════ */}
      <div className="hidden lg:flex min-h-screen" style={{ background: "#0F0A2E" }}>

        {/* ── Left panel ── */}
        <div
          className="flex flex-col justify-between flex-shrink-0"
          style={{ width: 600, background: "#100C2A", padding: "56px 72px" }}
        >
          {/* Logo */}
          <Link href="/" className="text-white font-bold" style={{ fontSize: 22 }}>
            ✨ EverStory
          </Link>

          {/* Main form content */}
          <div className="flex flex-col gap-8">
            {/* Back */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 self-start"
              style={{ color: "#9B8EC4" }}
            >
              <ArrowLeft size={18} />
              <span className="text-[14px]">Назад</span>
            </button>

            {/* Icon */}
            <div
              className="flex items-center justify-center rounded-[40px] flex-shrink-0"
              style={{
                width: 80,
                height: 80,
                background: "linear-gradient(135deg, #7B2FFF 0%, #4F46E5 100%)",
              }}
            >
              <MailCheck size={36} color="#FFFFFF" />
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-[10px]">
              <h1 className="text-white font-bold" style={{ fontSize: 32 }}>
                Проверьте почту
              </h1>
              <p className="text-[#9B8EC4]" style={{ fontSize: 15 }}>
                Мы отправили письмо со ссылкой подтверждения на:
              </p>
            </div>

            {/* Email card */}
            <div
              className="flex items-center gap-[10px] rounded-[16px]"
              style={{
                background: "#1A1050",
                border: "1px solid #7B2FFF",
                padding: "20px 24px",
              }}
            >
              <Mail size={18} color="#C4B5FD" className="flex-shrink-0" />
              <span className="text-[#C4B5FD] text-[16px] font-bold break-all">
                {displayEmail}
              </span>
            </div>

            {/* Steps card */}
            <div
              className="flex flex-col gap-[14px] rounded-[16px]"
              style={{
                background: "#0D0820",
                border: "1px solid #2D1B6B",
                padding: "20px 24px",
              }}
            >
              <span className="text-white text-[14px] font-bold">
                Что делать дальше?
              </span>
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center flex-shrink-0 text-white text-[12px] font-bold rounded-[12px]"
                    style={{ width: 24, height: 24, background: "#7B2FFF" }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-[#9B8EC4] text-[13px]">{step}</span>
                </div>
              ))}
            </div>

            {/* TTL */}
            <div className="flex items-center gap-2">
              <Timer size={14} color="#FFB703" />
              <span className="text-[#FFB703] text-[13px] font-semibold">
                Ссылка действует 24 часа
              </span>
            </div>

            {/* Resend section */}
            <div className="flex flex-col gap-[10px]">
              {!canResend && (
                <div className="flex items-center gap-[6px]">
                  <Timer size={14} color="#9B8EC4" />
                  <span className="text-[#9B8EC4] text-[13px]">
                    Повторная отправка через{" "}
                    <span className="text-[#C4B5FD] font-semibold">
                      {seconds} сек
                    </span>
                  </span>
                </div>
              )}
              {resendError && (
                <p className="text-red-400 text-[12px]">{resendError}</p>
              )}
              <div className="flex items-center gap-[6px]">
                <span className="text-[#9B8EC4] text-[13px]">
                  Не получили письмо?
                </span>
                <button
                  onClick={handleResend}
                  disabled={!canResend || resendLoading}
                  className="text-[#7B2FFF] text-[13px] font-semibold hover:underline disabled:opacity-40"
                >
                  {resendLoading ? "Отправка…" : "Отправить снова"}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <span className="text-[12px]" style={{ color: "#4A3B7A" }}>
            © EverStory 2025
          </span>
        </div>

        {/* ── Right panel ── */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse 140% 120% at 40% 30%, #3B1278 0%, #0D0820 100%)",
          }}
        >
          {/* Glow blobs */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 500,
              height: 500,
              left: 157,
              top: 200,
              background: "#7B2FFF",
              opacity: 0.15,
            }}
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 350,
              height: 350,
              left: 343,
              top: 420,
              background: "#4F46E5",
              opacity: 0.1,
            }}
          />

          {/* Circular illustration */}
          <div
            className="absolute overflow-hidden"
            style={{
              width: 480,
              height: 480,
              left: 143,
              top: 210,
              borderRadius: 240,
            }}
          >
            <Image
              src="/images/generated-1776376593829.png"
              alt="Email illustration"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Decorative dots */}
          <div className="absolute rounded-full" style={{ width: 4, height: 4, left: 60, top: 80, background: "#FFB703", opacity: 0.9 }} />
          <div className="absolute rounded-full" style={{ width: 3, height: 3, left: 550, top: 60, background: "#FFFFFF", opacity: 0.7 }} />
          <div className="absolute rounded-full" style={{ width: 2, height: 2, left: 120, top: 740, background: "#C4B5FD", opacity: 0.8 }} />
          <div className="absolute rounded-full" style={{ width: 3, height: 3, left: 600, top: 750, background: "#FFB703", opacity: 0.6 }} />
          <div className="absolute rounded-full" style={{ width: 2, height: 2, left: 350, top: 40, background: "#FFFFFF", opacity: 0.9 }} />

          {/* Tag card — mail */}
          <div
            className="absolute flex flex-col gap-[6px] rounded-[16px]"
            style={{
              left: 460,
              top: 130,
              background: "#1A1050",
              border: "1px solid #7B2FFF",
              padding: "16px 20px",
            }}
          >
            <span className="text-[#C4B5FD] text-[13px] font-semibold">
              ✉️ Проверь почту
            </span>
            <span className="text-[#9B8EC4] text-[11px]">письмо уже в пути!</span>
          </div>

          {/* Tag card — security */}
          <div
            className="absolute flex flex-col gap-[6px] rounded-[16px]"
            style={{
              left: 130,
              top: 668,
              background: "#1A1050",
              border: "1px solid #FFB703",
              padding: "14px 18px",
            }}
          >
            <span className="text-[#FFB703] text-[13px] font-semibold">
              🔒 Безопасно
            </span>
            <span className="text-[#9B8EC4] text-[11px]">данные защищены</span>
          </div>

          {/* Quote card */}
          <div
            className="absolute flex flex-col gap-[8px] rounded-[16px]"
            style={{
              left: 420,
              top: 680,
              background: "#1A1050",
              border: "1px solid #2D1B6B",
              padding: "16px 20px",
              maxWidth: 220,
            }}
          >
            <span className="text-white text-[13px] font-semibold leading-snug">
              «Процесс занял 30 секунд!»
            </span>
            <span className="text-[#9B8EC4] text-[11px]">
              — Мария, мама двоих детей
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
