"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { registerUser, saveTokens } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors: typeof errors = {};

    if (!name.trim()) fieldErrors.name = "Имя обязательно";
    if (!email.trim()) fieldErrors.email = "Email обязателен";
    if (!password) fieldErrors.password = "Пароль обязателен";
    else if (password.length < 6) fieldErrors.password = "Пароль должен содержать минимум 6 символов";

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const tokens = await registerUser(email, password);
      saveTokens(tokens);
      router.push("/home");
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      if (msg.toLowerCase().includes("already exists")) {
        setErrors({ general: "Пользователь с таким email уже существует" });
      } else {
        setErrors({ general: msg || "Произошла ошибка. Попробуйте снова." });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex font-sans">
      {/* ── LEFT PANEL / MOBILE FULL ── */}
      <div
        className="
          flex-1 flex flex-col justify-between
          px-6 py-10
          lg:px-[72px] lg:py-[56px]
          lg:max-w-[600px] lg:min-h-screen
        "
        style={{ background: "#100C2A" }}
      >
        {/* Mobile: radial gradient overlay */}
        <div
          className="fixed inset-0 lg:hidden pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 140% 80% at 50% 20%, #2D1178 0%, #0F0A2E 100%)",
          }}
        />

        <div className="relative flex flex-col gap-[20px] w-full max-w-[440px] mx-auto lg:mx-0 flex-1">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-2">
            <span className="text-white text-[22px] font-bold">✨ EverStory</span>
          </Link>

          {/* Heading */}
          <div className="flex flex-col gap-2 text-center lg:text-left mb-2">
            <h1 className="text-white text-[26px] lg:text-[32px] font-bold leading-tight">
              Добро пожаловать!
            </h1>
            <p className="text-[#9B8EC4] text-[14px] lg:text-[15px]">
              Создай аккаунт и начни творить магию
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-[14px] w-full">
            {/* Full name */}
            <div className="relative flex items-center gap-3 rounded-[16px] lg:rounded-[14px] px-[18px] h-[58px] lg:h-[56px]"
              style={{
                background: "#1A1050",
                border: `2px solid ${errors.name ? "#EF4444" : "#7B2FFF"}`,
              }}
            >
              <User size={18} color={errors.name ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0" />
              <input
                type="text"
                placeholder="Полное имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Полное имя"
                aria-invalid={!!errors.name}
                className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4] text-[15px] lg:text-[15px] font-medium"
              />
            </div>
            {errors.name && (
              <p role="alert" className="text-red-400 text-[12px] -mt-2 px-2">{errors.name}</p>
            )}

            {/* Email */}
            <div className="relative flex items-center gap-3 rounded-[16px] lg:rounded-[14px] px-[18px] h-[58px] lg:h-[56px]"
              style={{
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
                aria-label="Email"
                aria-invalid={!!errors.email}
                className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4] text-[15px] font-medium"
              />
            </div>
            {errors.email && (
              <p role="alert" className="text-red-400 text-[12px] -mt-2 px-2">{errors.email}</p>
            )}

            {/* Password */}
            <div className="relative flex items-center gap-3 rounded-[16px] lg:rounded-[14px] px-[18px] h-[58px] lg:h-[56px]"
              style={{
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
                autoComplete="new-password"
                aria-label="Пароль"
                aria-invalid={!!errors.password}
                className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4] text-[15px] font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="flex-shrink-0 text-[#9B8EC4] hover:text-white transition-colors"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>

            {errors.password && (
              <p role="alert" className="text-red-400 text-[12px] -mt-2 px-2">{errors.password}</p>
            )}

            {/* General error */}
            {errors.general && (
              <p role="alert" className="text-red-400 text-[13px] text-center px-2">{errors.general}</p>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[56px] rounded-[28px] text-white text-[17px] font-bold flex items-center justify-center transition-opacity disabled:opacity-60 mt-1"
              style={{
                background: "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)",
              }}
            >
              {loading ? "Загрузка…" : "Зарегистрироваться"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-[1px]" style={{ background: "#2D1B6B" }} />
            <span className="text-[#9B8EC4] text-[13px]">или</span>
            <div className="flex-1 h-[1px]" style={{ background: "#2D1B6B" }} />
          </div>

          {/* Google button */}
          <button
            type="button"
            className="w-full h-[54px] rounded-[16px] lg:rounded-[14px] flex items-center justify-center gap-[10px] font-semibold text-[15px] transition-colors hover:bg-gray-50"
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #E0E0E0",
              color: "#0F0A2E",
            }}
          >
            <GoogleIcon />
            <span className="hidden sm:inline">Регистрация через Google</span>
            <span className="sm:hidden">Войти через Google</span>
          </button>

          {/* Login link */}
          <div className="flex items-center justify-center gap-[6px] mt-1">
            <span className="text-[#9B8EC4] text-[14px]">Уже есть аккаунт?</span>
            <Link href="/login" className="text-[#A78BFA] text-[14px] font-bold hover:underline">
              Войти
            </Link>
          </div>

          {/* Terms */}
          <div className="flex flex-col items-center gap-[2px] mt-auto pt-4">
            <span className="text-[#9B8EC4] text-[11px] text-center">
              Регистрируясь, вы соглашаетесь с
            </span>
            <Link href="#" className="text-[#A78BFA] text-[11px] font-semibold hover:underline">
              Условиями использования
            </Link>
          </div>
        </div>

        {/* Footer — desktop only */}
        <div className="hidden lg:flex items-center justify-between w-full max-w-[440px] mx-auto lg:mx-0 mt-8">
          <span className="text-[#9B8EC4] text-[12px]">© EverStory 2025</span>
        </div>
      </div>

      {/* ── RIGHT PANEL — desktop only ── */}
      <div
        className="hidden lg:block flex-1 relative overflow-hidden"
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
            filter: "blur(1px)",
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
            filter: "blur(1px)",
          }}
        />

        {/* Illustration */}
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
            alt="Волшебная иллюстрация"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Decorative dots */}
        <div className="absolute w-1 h-1 rounded-full bg-[#FFB703] opacity-90" style={{ left: 60, top: 80 }} />
        <div className="absolute w-[3px] h-[3px] rounded-full bg-white opacity-70" style={{ left: 550, top: 60 }} />
        <div className="absolute w-[2px] h-[2px] rounded-full bg-[#C4B5FD] opacity-80" style={{ left: 120, top: 740 }} />
        <div className="absolute w-[3px] h-[3px] rounded-full bg-[#FFB703] opacity-60" style={{ left: 600, top: 750 }} />
        <div className="absolute w-[2px] h-[2px] rounded-full bg-white opacity-90" style={{ left: 350, top: 40 }} />

        {/* Tag card 1 */}
        <div
          className="absolute flex flex-col gap-[6px] rounded-[16px] px-[20px] py-[16px]"
          style={{
            left: 460,
            top: 130,
            background: "#1A1050",
            border: "1px solid #7B2FFF",
          }}
        >
          <span className="text-[#C4B5FD] text-[13px] font-semibold">✨ 10 000+ семей</span>
          <span className="text-[#9B8EC4] text-[11px]">уже создают магию</span>
        </div>

        {/* Tag card 2 */}
        <div
          className="absolute flex flex-col gap-[6px] rounded-[16px] px-[18px] py-[14px]"
          style={{
            left: 130,
            top: 668,
            background: "#1A1050",
            border: "1px solid #FFB703",
          }}
        >
          <span className="text-[#FFB703] text-[13px] font-semibold">⚡ 90 секунд</span>
          <span className="text-[#9B8EC4] text-[11px]">до готовой сказки</span>
        </div>

        {/* Quote card */}
        <div
          className="absolute flex flex-col gap-[8px] rounded-[16px] px-[20px] py-[16px]"
          style={{
            left: 420,
            top: 680,
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
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
