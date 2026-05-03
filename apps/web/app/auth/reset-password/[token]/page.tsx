"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { validateResetToken, resetPassword } from "@/lib/auth";

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [tokenError, setTokenError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<{ general?: string; newPassword?: string; confirmPassword?: string }>({});

  useEffect(() => {
    async function checkToken() {
      try {
        const result = await validateResetToken(token);
        if (result.valid) {
          setValidToken(true);
          setMaskedEmail(result.email || "");
        } else {
          setTokenError("Токен недействителен или истек.");
        }
      } catch (err: any) {
        setTokenError(err.message || "Токен недействителен или истек. Запросите новую ссылку.");
      } finally {
        setLoading(false);
      }
    }
    checkToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError({});

    const errors: typeof formError = {};
    if (newPassword.length < 8) {
      errors.newPassword = "Минимум 8 символов";
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.newPassword = "Нужна заглавная буква";
    } else if (!/[0-9]/.test(newPassword)) {
      errors.newPassword = "Нужна минимум одна цифра";
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Пароли не совпадают";
    }
    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      return;
    }

    setSubmitLoading(true);
    try {
      await resetPassword(token, newPassword, confirmPassword);
      setSuccess(true);
    } catch (err: any) {
      setFormError({ general: err.message || "Ошибка при сбросе пароля" });
    } finally {
      setSubmitLoading(false);
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
            Новый пароль
          </h1>
          {validToken && (
            <p
              className="text-center text-[13px] lg:text-[15px] max-w-[280px] lg:max-w-[340px]"
              style={{ color: "#9B8EC4" }}
            >
              Создайте новый пароль для аккаунта <b className="text-white">{maskedEmail}</b>
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7B2FFF]" />
          </div>
        ) : tokenError ? (
          <div className="flex flex-col items-center w-full gap-5 p-6 lg:p-8 rounded-[20px]" style={{ background: "#1A1050", border: "1.5px solid rgba(239,68,68,0.4)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
              <XCircle size={32} color="#EF4444" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <h2 className="text-white font-bold text-[18px] lg:text-[20px]">Срок действия ссылки истек</h2>
              <p className="text-center text-[13px] lg:text-[14px]" style={{ color: "#9B8EC4" }}>{tokenError}</p>
            </div>
            <Link
              href="/forgot-password"
              className="w-full flex items-center justify-center rounded-[25px] text-white font-bold transition-opacity"
              style={{
                height: 50,
                fontSize: 15,
                background: "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)",
              }}
            >
              Отправить новую ссылку
            </Link>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center w-full gap-5 p-6 lg:p-8 rounded-[20px]" style={{ background: "#1A1050", border: "1.5px solid #2D1B6B" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
              <CheckCircle2 size={32} color="#10B981" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <h2 className="text-white font-bold text-[18px] lg:text-[20px]">Готово!</h2>
              <p className="text-center text-[13px] lg:text-[14px]" style={{ color: "#9B8EC4" }}>
                Пароль успешно изменён. Теперь вы можете войти в аккаунт.
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
              Войти
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col w-full gap-3 lg:gap-3.5">

            {/* New Password */}
            <div>
              <div
                className="relative flex items-center gap-2.5 rounded-[14px]"
                style={{
                  height: 50,
                  background: "#1A1050",
                  border: `1.5px solid ${formError.newPassword ? "#EF4444" : "#2D1B6B"}`,
                  padding: "0 16px",
                }}
              >
                <Lock size={16} color={formError.newPassword ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0 lg:w-[18px] lg:h-[18px]" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Новый пароль"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              {formError.newPassword && <p role="alert" className="text-red-400 text-xs mt-1 px-1">{formError.newPassword}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <div
                className="relative flex items-center gap-2.5 rounded-[14px]"
                style={{
                  height: 50,
                  background: "#1A1050",
                  border: `1.5px solid ${formError.confirmPassword ? "#EF4444" : "#2D1B6B"}`,
                  padding: "0 16px",
                }}
              >
                <Lock size={16} color={formError.confirmPassword ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0 lg:w-[18px] lg:h-[18px]" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4]"
                  style={{ fontSize: 14, fontWeight: 500 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute text-[#9B8EC4] hover:text-white transition-colors"
                  style={{ right: 16, top: "50%", transform: "translateY(-50%)" }}
                  aria-label={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
              {formError.confirmPassword && <p role="alert" className="text-red-400 text-xs mt-1 px-1">{formError.confirmPassword}</p>}
            </div>

            {formError.general && (
              <p role="alert" className="text-red-400 text-sm text-center">{formError.general}</p>
            )}

            <button
              type="submit"
              disabled={submitLoading}
              className="flex items-center justify-center rounded-[25px] text-white font-bold disabled:opacity-60 transition-opacity"
              style={{
                height: 50,
                fontSize: 15,
                background: "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)",
              }}
            >
              {submitLoading ? "Сохранение…" : "Сохранить"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
