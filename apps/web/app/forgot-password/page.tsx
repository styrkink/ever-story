"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
    <div className="h-[100dvh] w-full flex font-sans overflow-hidden" style={{ background: "#0F0A2E" }}>

      {/* ════════════════════════════════════════
          MOBILE — full screen (hidden on lg+)
      ════════════════════════════════════════ */}
      <div className="flex lg:hidden flex-col w-full h-full relative overflow-y-auto overflow-x-hidden">
        {/* Radial gradient bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 140% 80% at 50% 20%, #2D1178 0%, #0F0A2E 100%)",
          }}
        />

        {/* Decorative stars */}
        <Star color="#FFB703" size={3} x={30}  y={120} opacity={0.9} />
        <Star color="#FFFFFF" size={4} x={355} y={80}  opacity={0.7} />
        <Star color="#C4B5FD" size={2} x={80}  y={200} opacity={0.8} />
        <Star color="#FFB703" size={3} x={320} y={160} opacity={0.6} />
        <Star color="#FFFFFF" size={2} x={170} y={60}  opacity={0.9} />

        {/* Content */}
        <div
          className="relative flex flex-col gap-[18px] w-full px-6 pt-[28px] pb-10 flex-1"
          style={{ marginTop: 62 /* below status bar area */ }}
        >
          {/* Logo — centered */}
          <div className="flex justify-center mb-1">
            <span className="text-white text-[22px] font-bold">✨ EverStory</span>
          </div>

          <div className="flex flex-col items-center gap-2 mb-4">
            <h1 className="text-white text-[26px] font-bold text-center leading-tight">
              Сброс пароля
            </h1>
            <p className="text-[#9B8EC4] text-[14px] text-center" style={{ maxWidth: 280 }}>
              Введите ваш email, и мы отправим ссылку для создания нового пароля.
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center justify-center p-6 bg-[#1A1050] rounded-[24px] border border-[#2D1B6B]">
              <div className="w-16 h-16 bg-[#10B981]/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-[#10B981]" />
              </div>
              <h2 className="text-white text-lg font-bold mb-2">Письмо отправлено!</h2>
              <p className="text-[#9B8EC4] text-center text-sm mb-6">
                Проверьте вашу почту (включая папку "Спам").
              </p>
              <Link
                href="/login"
                className="w-full flex items-center justify-center rounded-[28px] text-white font-bold transition-opacity"
                style={{
                  padding: "16px 0",
                  fontSize: 16,
                  background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)",
                }}
              >
                Вернуться ко входу
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
              <div>
                <div
                  className="flex items-center gap-3 rounded-[16px] px-[18px]"
                  style={{
                    height: 58,
                    background: "#1A1050",
                    border: `2px solid ${error ? "#EF4444" : "#7B2FFF"}`,
                  }}
                >
                  <Mail size={18} color={error ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4] font-semibold"
                    style={{ fontSize: 17 }}
                  />
                </div>
                {error && <p role="alert" className="text-red-400 text-[12px] mt-1 px-2">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center rounded-[28px] text-white font-bold disabled:opacity-60 transition-opacity mt-2"
                style={{
                  padding: "18px 0",
                  fontSize: 17,
                  background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)",
                }}
              >
                {loading ? "Отправка..." : "Отправить ссылку"}
              </button>

              <div className="flex justify-center mt-4">
                <Link href="/login" className="flex items-center gap-2 text-[#9B8EC4] hover:text-white transition-colors text-sm font-medium">
                  <ArrowLeft size={16} /> Назад ко входу
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* ════════════════════════════════════════
          DESKTOP — split layout (hidden below lg)
      ════════════════════════════════════════ */}
      <div className="hidden lg:flex w-full h-full">
        {/* Left panel */}
        <div
          className="flex flex-col justify-center lg:justify-between flex-shrink-0 overflow-y-auto overflow-x-hidden"
          style={{ width: 600, background: "#100C2A", padding: "40px 72px" }}
        >
          <div className="flex flex-col gap-6 flex-1">
            <Link href="/" className="text-white font-bold mb-2" style={{ fontSize: 22 }}>
              ✨ EverStory
            </Link>

            <div className="flex flex-col gap-2 mb-4">
              <h1 className="text-white font-bold" style={{ fontSize: 32 }}>Сброс пароля</h1>
              <p className="text-[#9B8EC4]" style={{ fontSize: 15 }}>
                Введите ваш email, и мы отправим ссылку для создания нового пароля.
              </p>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center p-8 bg-[#1A1050] rounded-[24px] border border-[#2D1B6B] mt-4">
                <div className="w-16 h-16 bg-[#10B981]/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-[#10B981]" />
                </div>
                <h2 className="text-white text-xl font-bold mb-2">Письмо отправлено!</h2>
                <p className="text-[#9B8EC4] text-center text-base mb-8">
                  Мы отправили письмо с дальнейшими инструкциями на <b>{email}</b>. Проверьте вашу почту (включая папку "Спам").
                </p>
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center rounded-[28px] text-white font-bold transition-opacity"
                  style={{
                    padding: "16px 0",
                    fontSize: 16,
                    background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)",
                  }}
                >
                  Вернуться ко входу
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <div
                    className="flex items-center gap-3 rounded-[14px] px-[18px]"
                    style={{
                      height: 56,
                      background: "#1A1050",
                      border: `2px solid ${error ? "#EF4444" : "#7B2FFF"}`,
                    }}
                  >
                    <Mail size={18} color={error ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4]"
                      style={{ fontSize: 15, fontWeight: 500 }}
                    />
                  </div>
                  {error && <p role="alert" className="text-red-400 text-[13px] mt-1 px-1">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center rounded-[28px] text-white font-bold disabled:opacity-60 transition-opacity mt-2"
                  style={{
                    height: 56,
                    fontSize: 16,
                    background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)",
                  }}
                >
                  {loading ? "Отправка..." : "Отправить ссылку"}
                </button>

                <div className="flex justify-center mt-6">
                  <Link href="/login" className="flex items-center gap-2 text-[#9B8EC4] hover:text-white transition-colors text-sm font-medium">
                    <ArrowLeft size={16} /> Назад ко входу
                  </Link>
                </div>
              </form>
            )}
          </div>

          <div className="pt-8">
            <span className="text-[12px]" style={{ color: "#4A3B7A" }}>© EverStory 2025</span>
          </div>
        </div>

        {/* Right panel */}
        <div
          className="flex-1 relative overflow-hidden h-full"
          style={{
            background:
              "radial-gradient(ellipse 140% 120% at 40% 30%, #3B1278 0%, #0D0820 100%)",
          }}
        >
          {/* Glow blobs */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{ width: 500, height: 500, left: 157, top: 200, background: "#7B2FFF", opacity: 0.15 }}
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{ width: 350, height: 350, left: 343, top: 420, background: "#4F46E5", opacity: 0.1 }}
          />

          {/* Illustration — clipped circle (reusing login image) */}
          <div
            className="absolute overflow-hidden"
            style={{ width: 480, height: 480, left: 143, top: 210, borderRadius: 240 }}
          >
            <Image
              src="/images/generated-1776734537268.png"
              alt="Иллюстрация"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Decorative stars */}
          <Star color="#FFB703" size={4} x={60}  y={80}  opacity={0.9} />
          <Star color="#FFFFFF" size={3} x={550} y={60}  opacity={0.7} />
          <Star color="#FFFFFF" size={2} x={350} y={40}  opacity={0.9} />
        </div>
      </div>
    </div>
  );
}

function Star({
  color, size, x, y, opacity,
}: {
  color: string; size: number; x: number; y: number; opacity: number;
}) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, left: x, top: y, background: color, opacity }}
    />
  );
}
