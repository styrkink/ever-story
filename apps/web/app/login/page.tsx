"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { loginUser, saveTokens } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState<{ email?: string; password?: string; general?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors: typeof errors = {};
    if (!email.trim()) fieldErrors.email    = "Email обязателен";
    if (!password)     fieldErrors.password = "Пароль обязателен";
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      const tokens = await loginUser(email, password);
      saveTokens(tokens);
      router.push("/home");
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("not found"))
        setErrors({ general: "Неверный email или пароль" });
      else
        setErrors({ general: msg || "Произошла ошибка. Попробуйте снова." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex font-sans" style={{ background: "#0F0A2E" }}>

      {/* ════════════════════════════════════════
          MOBILE — full screen (hidden on lg+)
      ════════════════════════════════════════ */}
      <div className="flex lg:hidden flex-col w-full relative overflow-hidden">

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
          className="relative flex flex-col gap-[18px] w-full px-6 pt-[28px] pb-10"
          style={{ marginTop: 62 /* below status bar area */ }}
        >
          {/* Logo — centered */}
          <div className="flex justify-center mb-1">
            <span className="text-white text-[22px] font-bold">✨ EverStory</span>
          </div>

          {/* Heading — centered */}
          <div className="flex flex-col items-center gap-2 mb-1">
            <h1 className="text-white text-[26px] font-bold text-center leading-tight">
              С возвращением!
            </h1>
            <p className="text-[#9B8EC4] text-[14px] text-center" style={{ maxWidth: 280 }}>
              Войди и продолжи создавать магию
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
            {/* Email */}
            <div>
              <div
                className="flex items-center gap-3 rounded-[16px] px-[18px]"
                style={{
                  height: 58,
                  background: "#1A1050",
                  border: `2px solid ${errors.email ? "#EF4444" : "#7B2FFF"}`,
                }}
              >
                <Mail size={18} color={errors.email ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0" />
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
              {errors.email && <p role="alert" className="text-red-400 text-[12px] mt-1 px-2">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div
                className="relative flex items-center gap-3 rounded-[16px] px-[18px]"
                style={{
                  height: 58,
                  background: "#1A1050",
                  border: `2px solid ${errors.password ? "#EF4444" : "#7B2FFF"}`,
                }}
              >
                <Lock size={18} color={errors.password ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4] font-semibold"
                  style={{ fontSize: 17 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute text-[#9B8EC4] hover:text-white transition-colors"
                  style={{ right: 18, top: "50%", transform: "translateY(-50%)" }}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {errors.password && <p role="alert" className="text-red-400 text-[12px] mt-1 px-2">{errors.password}</p>}
            </div>

            {/* Forgot */}
            <div className="flex justify-end -mt-2">
              <Link href="#" className="text-[#7B2FFF] text-[13px] font-semibold hover:underline">
                Забыли пароль?
              </Link>
            </div>

            {errors.general && (
              <p role="alert" className="text-red-400 text-[13px] text-center -mt-2">{errors.general}</p>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center rounded-[28px] text-white font-bold disabled:opacity-60 transition-opacity"
              style={{
                padding: "18px 0",
                fontSize: 17,
                background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)",
              }}
            >
              {loading ? "Загрузка…" : "Войти"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "#2D1B6B" }} />
            <span className="text-[#9B8EC4] text-[13px]">или</span>
            <div className="flex-1 h-px" style={{ background: "#2D1B6B" }} />
          </div>

          {/* Google */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-[10px] rounded-[16px] font-semibold transition-colors hover:bg-gray-50"
            style={{
              height: 54,
              background: "#FFFFFF",
              border: "1.5px solid #E0E0E0",
              color: "#0F0A2E",
              fontSize: 15,
            }}
          >
            <GoogleIcon />
            Войти через Google
          </button>

          {/* Register link */}
          <div className="flex items-center justify-center gap-[6px]">
            <span className="text-[#9B8EC4] text-[14px]">Нет аккаунта?</span>
            <Link href="/register" className="text-[#7B2FFF] text-[14px] font-bold hover:underline">
              Создать
            </Link>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          DESKTOP — split layout (hidden below lg)
      ════════════════════════════════════════ */}
      <div className="hidden lg:flex w-full">

        {/* Left panel */}
        <div
          className="flex flex-col justify-between flex-shrink-0"
          style={{ width: 600, background: "#100C2A", padding: "56px 72px" }}
        >
          <div className="flex flex-col gap-5 flex-1">
            {/* Logo */}
            <Link href="/" className="text-white font-bold mb-1" style={{ fontSize: 22 }}>
              ✨ EverStory
            </Link>

            {/* Heading */}
            <div className="flex flex-col gap-2 mb-1">
              <h1 className="text-white font-bold" style={{ fontSize: 32 }}>С возвращением!</h1>
              <p className="text-[#9B8EC4]" style={{ fontSize: 15 }}>Войди и продолжи создавать магию</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <div
                  className="flex items-center gap-3 rounded-[14px] px-[18px]"
                  style={{
                    height: 56,
                    background: "#1A1050",
                    border: `2px solid ${errors.email ? "#EF4444" : "#7B2FFF"}`,
                  }}
                >
                  <Mail size={18} color={errors.email ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0" />
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
                {errors.email && <p role="alert" className="text-red-400 text-[12px] mt-1 px-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <div
                  className="relative flex items-center gap-3 rounded-[14px] px-[18px]"
                  style={{
                    height: 56,
                    background: "#1A1050",
                    border: `2px solid ${errors.password ? "#EF4444" : "#7B2FFF"}`,
                  }}
                >
                  <Lock size={18} color={errors.password ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4]"
                    style={{ fontSize: 15, fontWeight: 500 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute text-[#9B8EC4] hover:text-white transition-colors"
                    style={{ right: 18, top: "50%", transform: "translateY(-50%)" }}
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {errors.password && <p role="alert" className="text-red-400 text-[12px] mt-1 px-1">{errors.password}</p>}
              </div>

              {/* Forgot */}
              <div className="flex justify-end -mt-1">
                <Link href="#" className="text-[#7B2FFF] text-[13px] font-semibold hover:underline">
                  Забыли пароль?
                </Link>
              </div>

              {errors.general && (
                <p role="alert" className="text-red-400 text-[13px] text-center -mt-2">{errors.general}</p>
              )}

              {/* CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center rounded-[28px] text-white font-bold disabled:opacity-60 transition-opacity"
                style={{
                  height: 56,
                  fontSize: 16,
                  background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)",
                }}
              >
                {loading ? "Загрузка…" : "Войти"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "#2D1B6B" }} />
              <span className="text-[#9B8EC4] text-[13px]">или</span>
              <div className="flex-1 h-px" style={{ background: "#2D1B6B" }} />
            </div>

            {/* Google */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-[10px] rounded-[14px] font-semibold transition-colors hover:bg-gray-50"
              style={{
                height: 52,
                background: "#FFFFFF",
                border: "1.5px solid #E0E0E0",
                color: "#0F0A2E",
                fontSize: 15,
              }}
            >
              <GoogleIcon />
              Войти через Google
            </button>

            {/* Register link */}
            <div className="flex items-center justify-center gap-[6px]">
              <span className="text-[#9B8EC4] text-[14px]">Нет аккаунта?</span>
              <Link href="/register" className="text-[#7B2FFF] text-[14px] font-bold hover:underline">
                Создать
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8">
            <span className="text-[12px]" style={{ color: "#4A3B7A" }}>© EverStory 2025</span>
          </div>
        </div>

        {/* Right panel */}
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
            style={{ width: 500, height: 500, left: 157, top: 200, background: "#7B2FFF", opacity: 0.15 }}
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{ width: 350, height: 350, left: 343, top: 420, background: "#4F46E5", opacity: 0.1 }}
          />

          {/* Illustration — clipped circle */}
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

          {/* Tag card */}
          <div
            className="absolute flex flex-col gap-[6px] rounded-[16px] px-5 py-4"
            style={{ left: 460, top: 130, background: "#1A1050", border: "1px solid #7B2FFF" }}
          >
            <span className="text-[#C4B5FD] text-[13px] font-semibold">✨ 10 000+ семей</span>
            <span className="text-[#9B8EC4] text-[11px]">уже создают магию</span>
          </div>

          {/* Quote card */}
          <div
            className="absolute flex flex-col gap-2 rounded-[16px] px-5 py-4"
            style={{
              left: 420, top: 680,
              background: "#1A1050",
              border: "1px solid #2D1B6B",
              maxWidth: 220,
            }}
          >
            <span className="text-white text-[13px] font-semibold leading-snug">
              «Мой сын в восторге!»
            </span>
            <span className="text-[#9B8EC4] text-[11px]">— Анна, мама 5-летнего Димы</span>
          </div>
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

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
