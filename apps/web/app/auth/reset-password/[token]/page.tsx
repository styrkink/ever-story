"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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

        {/* Content */}
        <div
          className="relative flex flex-col gap-[18px] w-full px-6 pt-[28px] pb-10 flex-1"
          style={{ marginTop: 62 }}
        >
          {/* Logo — centered */}
          <div className="flex justify-center mb-1">
            <span className="text-white text-[22px] font-bold">✨ EverStory</span>
          </div>

          <div className="flex flex-col items-center gap-2 mb-4">
            <h1 className="text-white text-[26px] font-bold text-center leading-tight">
              Новый пароль
            </h1>
            {validToken && (
              <p className="text-[#9B8EC4] text-[14px] text-center" style={{ maxWidth: 280 }}>
                Создайте новый пароль для аккаунта <b>{maskedEmail}</b>
              </p>
            )}
          </div>

          {loading ? (
             <div className="flex justify-center p-8">
               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7B2FFF]"></div>
             </div>
          ) : tokenError ? (
            <div className="flex flex-col items-center justify-center p-6 bg-[#1A1050] rounded-[24px] border border-[#EF4444]/50 text-center">
              <div className="w-16 h-16 bg-[#EF4444]/20 rounded-full flex items-center justify-center mb-4">
                <XCircle size={32} className="text-[#EF4444]" />
              </div>
              <h2 className="text-white text-lg font-bold mb-2">Не удалось проверить ссылку</h2>
              <p className="text-[#9B8EC4] text-sm mb-6">{tokenError}</p>
              <Link
                href="/forgot-password"
                className="w-full flex items-center justify-center rounded-[28px] text-white font-bold transition-opacity"
                style={{
                  padding: "16px 0",
                  fontSize: 16,
                  background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)",
                }}
              >
                Отправить новую ссылку
              </Link>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center p-6 bg-[#1A1050] rounded-[24px] border border-[#2D1B6B] text-center">
              <div className="w-16 h-16 bg-[#10B981]/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-[#10B981]" />
              </div>
              <h2 className="text-white text-lg font-bold mb-2">Обновлено!</h2>
              <p className="text-[#9B8EC4] text-sm mb-6">Ваш пароль успешно изменен.</p>
              <Link
                href="/login"
                className="w-full flex items-center justify-center rounded-[28px] text-white font-bold transition-opacity"
                style={{
                  padding: "16px 0",
                  fontSize: 16,
                  background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)",
                }}
              >
                Войти
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
              {/* New Password */}
              <div>
                <div
                  className="relative flex items-center gap-3 rounded-[16px] px-[18px]"
                  style={{
                    height: 58,
                    background: "#1A1050",
                    border: `2px solid ${formError.newPassword ? "#EF4444" : "#7B2FFF"}`,
                  }}
                >
                  <Lock size={18} color={formError.newPassword ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Новый пароль"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4] font-semibold"
                    style={{ fontSize: 17 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute text-[#9B8EC4] hover:text-white transition-colors"
                    style={{ right: 18, top: "50%", transform: "translateY(-50%)" }}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {formError.newPassword && <p role="alert" className="text-red-400 text-[12px] mt-1 px-2">{formError.newPassword}</p>}
              </div>

               {/* Confirm Password */}
               <div>
                <div
                  className="relative flex items-center gap-3 rounded-[16px] px-[18px]"
                  style={{
                    height: 58,
                    background: "#1A1050",
                    border: `2px solid ${formError.confirmPassword ? "#EF4444" : "#7B2FFF"}`,
                  }}
                >
                  <Lock size={18} color={formError.confirmPassword ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Повторите пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4] font-semibold"
                    style={{ fontSize: 17 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute text-[#9B8EC4] hover:text-white transition-colors"
                    style={{ right: 18, top: "50%", transform: "translateY(-50%)" }}
                  >
                    {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {formError.confirmPassword && <p role="alert" className="text-red-400 text-[12px] mt-1 px-2">{formError.confirmPassword}</p>}
              </div>

              {formError.general && (
                <p role="alert" className="text-red-400 text-[13px] text-center -mt-2">{formError.general}</p>
              )}

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full flex items-center justify-center rounded-[28px] text-white font-bold disabled:opacity-60 transition-opacity mt-2"
                style={{
                  padding: "18px 0",
                  fontSize: 17,
                  background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)",
                }}
              >
                {submitLoading ? "Сохранение..." : "Сохранить"}
              </button>
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
              <h1 className="text-white font-bold" style={{ fontSize: 32 }}>Новый пароль</h1>
              {validToken && (
                <p className="text-[#9B8EC4]" style={{ fontSize: 15 }}>
                  Создайте новый пароль для аккаунта <b>{maskedEmail}</b>
                </p>
              )}
            </div>

            {loading ? (
             <div className="flex justify-center p-8">
               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7B2FFF]"></div>
             </div>
            ) : tokenError ? (
              <div className="flex flex-col items-center justify-center p-8 bg-[#1A1050] rounded-[24px] border border-[#EF4444]/50 text-center mt-4">
                <div className="w-16 h-16 bg-[#EF4444]/20 rounded-full flex items-center justify-center mb-4">
                  <XCircle size={32} className="text-[#EF4444]" />
                </div>
                <h2 className="text-white text-xl font-bold mb-2">Срок действия ссылки истек</h2>
                <p className="text-[#9B8EC4] text-base mb-8">
                  {tokenError}
                </p>
                <Link
                  href="/forgot-password"
                  className="w-full flex items-center justify-center rounded-[28px] text-white font-bold transition-opacity"
                  style={{
                    padding: "16px 0",
                    fontSize: 16,
                    background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)",
                  }}
                >
                  Отправить новую ссылку
                </Link>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center justify-center p-8 bg-[#1A1050] rounded-[24px] border border-[#2D1B6B] mt-4 text-center">
                <div className="w-16 h-16 bg-[#10B981]/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-[#10B981]" />
                </div>
                <h2 className="text-white text-xl font-bold mb-2">Готово!</h2>
                <p className="text-[#9B8EC4] text-base mb-8">
                  Пароль успешно изменен. Теперь вы можете войти в аккаунт.
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
                  Войти
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* New Password */}
                <div>
                  <div
                    className="relative flex items-center gap-3 rounded-[14px] px-[18px]"
                    style={{
                      height: 56,
                      background: "#1A1050",
                      border: `2px solid ${formError.newPassword ? "#EF4444" : "#7B2FFF"}`,
                    }}
                  >
                    <Lock size={18} color={formError.newPassword ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Новый пароль"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4]"
                      style={{ fontSize: 15, fontWeight: 500 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute text-[#9B8EC4] hover:text-white transition-colors"
                      style={{ right: 18, top: "50%", transform: "translateY(-50%)" }}
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  {formError.newPassword && <p role="alert" className="text-red-400 text-[12px] mt-1 px-1">{formError.newPassword}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <div
                    className="relative flex items-center gap-3 rounded-[14px] px-[18px]"
                    style={{
                      height: 56,
                      background: "#1A1050",
                      border: `2px solid ${formError.confirmPassword ? "#EF4444" : "#7B2FFF"}`,
                    }}
                  >
                    <Lock size={18} color={formError.confirmPassword ? "#EF4444" : "#7B2FFF"} className="flex-shrink-0" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Повторите пароль"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-white placeholder-[#9B8EC4]"
                      style={{ fontSize: 15, fontWeight: 500 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute text-[#9B8EC4] hover:text-white transition-colors"
                      style={{ right: 18, top: "50%", transform: "translateY(-50%)" }}
                    >
                      {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  {formError.confirmPassword && <p role="alert" className="text-red-400 text-[12px] mt-1 px-1">{formError.confirmPassword}</p>}
                </div>

                {formError.general && (
                  <p role="alert" className="text-red-400 text-[13px] text-center -mt-2">{formError.general}</p>
                )}

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full flex items-center justify-center rounded-[28px] text-white font-bold disabled:opacity-60 transition-opacity mt-2"
                  style={{
                    height: 56,
                    fontSize: 16,
                    background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)",
                  }}
                >
                  {submitLoading ? "Сохранение..." : "Сохранить"}
                </button>
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
