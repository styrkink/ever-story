"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Eye, EyeOff, Wand2, ImageIcon, Heart } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { registerUser, loginWithGoogle, saveTokens } from "@/lib/auth";

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
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      const tokens = await registerUser(email, password);
      saveTokens(tokens);
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      if (msg.toLowerCase().includes("already exists"))
        setErrors({ general: "Пользователь с таким email уже существует" });
      else
        setErrors({ general: msg || "Произошла ошибка. Попробуйте снова." });
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const tokens = await loginWithGoogle(tokenResponse.access_token);
        saveTokens(tokens);
        router.push("/home");
      } catch (err: any) {
        setErrors({ general: err?.message || "Ошибка регистрации через Google" });
      } finally {
        setLoading(false);
      }
    },
    onError: () => setErrors({ general: "Регистрация через Google была отменена или завершилась с ошибкой" }),
  });

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
      <div className="relative z-10 flex flex-col items-center w-full px-7 py-5 gap-4 lg:w-[440px] lg:px-0 lg:py-10 lg:gap-8">

        {/* Logo */}
        <Link href="/" className="text-white font-bold text-[22px] lg:text-[26px]" style={{ fontFamily: "Inter" }}>
          ✨ EverStory
        </Link>

        {/* Heading */}
        <div className="flex flex-col items-center gap-2">
          <h1
            className="text-white text-center text-[20px] lg:text-[36px] whitespace-nowrap"
            style={{ fontFamily: "Inter", fontWeight: 800, lineHeight: 1.15 }}
          >
            Каждый вечер — новая сказка
          </h1>
          <p
            className="text-center text-[13px] lg:text-[15px] max-w-[280px] lg:max-w-[340px]"
            style={{ color: "#9B8EC4" }}
          >
            Персональные истории, созданные ИИ специально для вашего ребёнка
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col w-full gap-2 lg:gap-3.5">

          {/* Name */}
          <div>
            <div
              className="flex items-center gap-2.5 rounded-[14px]"
              style={{
                height: 50,
                background: "#1A1050",
                border: `1.5px solid ${errors.name ? "#EF4444" : "#2D1B6B"}`,
                padding: "0 16px",
              }}
            >
              <User size={16} color={errors.name ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0 lg:w-[18px] lg:h-[18px]" />
              <input
                type="text"
                placeholder="Полное имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4]"
                style={{ fontSize: 14, fontWeight: 500 }}
              />
            </div>
            {errors.name && <p role="alert" className="text-red-400 text-xs mt-1 px-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <div
              className="flex items-center gap-2.5 rounded-[14px]"
              style={{
                height: 50,
                background: "#1A1050",
                border: `1.5px solid ${errors.email ? "#EF4444" : "#2D1B6B"}`,
                padding: "0 16px",
              }}
            >
              <Mail size={16} color={errors.email ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0 lg:w-[18px] lg:h-[18px]" />
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
            {errors.email && <p role="alert" className="text-red-400 text-xs mt-1 px-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <div
              className="relative flex items-center gap-2.5 rounded-[14px]"
              style={{
                height: 50,
                background: "#1A1050",
                border: `1.5px solid ${errors.password ? "#EF4444" : "#2D1B6B"}`,
                padding: "0 16px",
              }}
            >
              <Lock size={16} color={errors.password ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0 lg:w-[18px] lg:h-[18px]" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4]"
                style={{ fontSize: 14, fontWeight: 500 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute text-[#9B8EC4] hover:text-white transition-colors"
                style={{ right: 16, top: "50%", transform: "translateY(-50%)" }}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            {errors.password && <p role="alert" className="text-red-400 text-xs mt-1 px-1">{errors.password}</p>}
          </div>

          {errors.general && (
            <p role="alert" className="text-red-400 text-sm text-center">{errors.general}</p>
          )}

          {/* CTA */}
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
            {loading ? "Загрузка…" : "Зарегистрироваться"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1" style={{ height: 1, background: "#2D1B6B" }} />
            <span style={{ color: "#9B8EC4", fontSize: 12 }}>или</span>
            <div className="flex-1" style={{ height: 1, background: "#2D1B6B" }} />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={() => handleGoogleRegister()}
            disabled={loading}
            className="flex items-center justify-center gap-2.5 rounded-[14px] font-semibold hover:bg-gray-50 disabled:opacity-60 transition-colors"
            style={{
              height: 50,
              background: "#FFFFFF",
              border: "1.5px solid #E0E0E0",
              color: "#0F0A2E",
              fontSize: 14,
            }}
          >
            <GoogleIcon />
            {loading ? "Загрузка…" : (
              <>
                <span className="lg:hidden">Войти через Google</span>
                <span className="hidden lg:inline">Регистрация через Google</span>
              </>
            )}
          </button>
        </form>

        {/* Terms */}
        <div className="flex flex-col items-center gap-0.5">
          <span style={{ color: "#9B8EC4", fontSize: 11 }}>Регистрируясь, вы соглашаетесь с</span>
          <Link href="#" className="hover:underline" style={{ color: "#7B2FFF", fontSize: 11, fontWeight: 600 }}>
            Условиями использования
          </Link>
        </div>

        {/* Login link */}
        <div className="flex items-center justify-center gap-1.5">
          <span style={{ color: "#9B8EC4", fontSize: 13 }}>Уже есть аккаунт?</span>
          <Link href="/login" className="hover:underline" style={{ color: "#7B2FFF", fontSize: 13, fontWeight: 700 }}>
            Войти
          </Link>
        </div>

        {/* Badges */}
        <div className="flex items-center justify-center gap-3 lg:gap-6">
          <Badge icon={<Wand2 size={14} color="#FFB703" />} mobileLabel="Сюжеты" desktopLabel="Уникальные сюжеты" />
          <Badge icon={<ImageIcon size={14} color="#FFB703" />} mobileLabel="Иллюстрации" desktopLabel="Красивые иллюстрации" />
          <Badge icon={<Heart size={14} color="#FFB703" />} mobileLabel="Воспоминания" desktopLabel="Семейные воспоминания" />
        </div>

      </div>
    </div>
  );
}

function Badge({
  icon,
  label,
  mobileLabel,
  desktopLabel,
}: {
  icon: React.ReactNode;
  label?: string;
  mobileLabel?: string;
  desktopLabel?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      {label && <span className="whitespace-nowrap" style={{ color: "#9B8EC4", fontSize: 10, fontWeight: 500 }}>{label}</span>}
      {mobileLabel && <span className="lg:hidden whitespace-nowrap" style={{ color: "#9B8EC4", fontSize: 10, fontWeight: 500 }}>{mobileLabel}</span>}
      {desktopLabel && <span className="hidden lg:inline whitespace-nowrap" style={{ color: "#9B8EC4", fontSize: 12, fontWeight: 500 }}>{desktopLabel}</span>}
    </div>
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
