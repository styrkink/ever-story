"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Пожалуйста, введите ваш Email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Произошла ошибка. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-[100dvh] w-full flex items-center justify-center overflow-hidden relative font-sans"
      style={{
        background: "radial-gradient(ellipse 160% 120% at 50% 38%, #1A1050 0%, #0F0A2E 60%, #080620 100%)",
      }}
    >
      {/* Orbs — mobile */}
      <div className="lg:hidden absolute rounded-full pointer-events-none" style={{ width: 280, height: 280, left: -40, top: 30, background: "#7B2FFF", opacity: 0.07 }} />
      <div className="lg:hidden absolute rounded-full pointer-events-none" style={{ width: 220, height: 220, left: 200, top: 550, background: "#4F46E5", opacity: 0.05 }} />
      {/* Orbs — desktop */}
      <div className="hidden lg:block absolute rounded-full pointer-events-none" style={{ width: 600, height: 600, left: 100, top: 50, background: "#7B2FFF", opacity: 0.06 }} />
      <div className="hidden lg:block absolute rounded-full pointer-events-none" style={{ width: 400, height: 400, left: 900, top: 500, background: "#4F46E5", opacity: 0.05 }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full px-7 py-10 gap-7 lg:w-[440px] lg:px-0 lg:gap-8">

        {/* Logo */}
        <span className="text-white font-bold text-[22px] lg:text-[26px]" style={{ fontFamily: "Inter" }}>
          ✨ EverStory
        </span>

        {/* Heading */}
        <div className="flex flex-col items-center gap-2">
          <h1
            className="text-white text-center text-[28px] lg:text-[36px]"
            style={{ fontFamily: "Inter", fontWeight: 800, lineHeight: 1.15 }}
          >
            Сброс пароля
          </h1>
          <p
            className="text-center text-[13px] lg:text-[15px] max-w-[280px] lg:max-w-[340px]"
            style={{ color: "#9B8EC4" }}
          >
            Введите ваш email, и мы отправим ссылку для создания нового пароля
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center w-full gap-5 p-6 lg:p-8 rounded-[20px]" style={{ background: "#1A1050", border: "1.5px solid #2D1B6B" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
              <CheckCircle2 size={32} color="#10B981" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <h2 className="text-white font-bold text-[18px] lg:text-[20px]">Письмо отправлено!</h2>
              <p className="text-center text-[13px] lg:text-[14px]" style={{ color: "#9B8EC4" }}>
                Проверьте вашу почту (включая папку «Спам»)
              </p>
            </div>
            <Link
              href="/login"
              className="w-full flex items-center justify-center rounded-[25px] text-white font-bold transition-opacity"
              style={{
                height: 50,
                fontSize: 15,
                background: "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)",
              }}
            >
              Вернуться ко входу
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col w-full gap-3 lg:gap-3.5">
            <div>
              <div
                className="flex items-center gap-2.5 rounded-[14px]"
                style={{
                  height: 50,
                  background: "#1A1050",
                  border: `1.5px solid ${error ? "#EF4444" : "#2D1B6B"}`,
                  padding: "0 16px",
                }}
              >
                <Mail size={16} color={error ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0 lg:w-[18px] lg:h-[18px]" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4]"
                  style={{ fontSize: 14, fontWeight: 500 }}
                />
              </div>
              {error && <p role="alert" className="text-red-400 text-xs mt-1 px-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center rounded-[25px] text-white font-bold disabled:opacity-60 transition-opacity"
              style={{
                height: 50,
                fontSize: 15,
                background: "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)",
              }}
            >
              {loading ? "Отправка…" : "Отправить ссылку"}
            </button>

            <div className="flex justify-center mt-1">
              <Link
                href="/login"
                className="flex items-center gap-1.5 hover:text-white transition-colors text-[13px] font-medium"
                style={{ color: "#9B8EC4" }}
              >
                <ArrowLeft size={14} /> Назад ко входу
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
