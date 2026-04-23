"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { ShieldCheck, ArrowLeft, Check, Loader2, AlertCircle } from "lucide-react";
import { createCoppaIntent, AuthError } from "@/lib/api";

// Инициализируем Stripe один раз вне компонента (лучшая практика Stripe)
console.log("Stripe Key from ENV:", process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);


// ── Внутренняя форма (используется внутри <Elements>) ─────────────────────────

function CoppaPaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe   = useStripe();
  const elements = useElements();

  const [status,  setStatus]  = useState<"idle" | "processing" | "error">("idle");
  const [errMsg,  setErrMsg]  = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setStatus("processing");
    setErrMsg(null);

    const { error } = await stripe.confirmPayment({
      elements,
      // После успешной оплаты Stripe перенаправляет сюда.
      // return_url нужен даже если мы обрабатываем через webhook.
      // Мы указываем /home — там пользователь увидит обновлённый статус.
      confirmParams: {
        return_url: `${window.location.origin}/home`,
      },
      // Не редиректим если можем обработать Payment без редиректа
      redirect: "if_required",
    });

    if (error) {
      setStatus("error");
      setErrMsg(error.message ?? "Ошибка обработки платежа");
    } else {
      // Платёж подтверждён — webhook обновит coppaVerifiedAt в БД.
      // Показываем пользователю успех и редиректим.
      setStatus("idle");
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Stripe Payment Element — рендерит форму карты */}
      <div
        className="rounded-[14px] p-4"
        style={{ background: "#261F4A", border: "1px solid #3D2F7A" }}
      >
        <PaymentElement
          options={{
            layout: "tabs",
            fields: {
              billingDetails: {
                name: "auto",
                email: "auto",
              },
            },
          }}
        />
      </div>

      {/* Info row */}
      <div
        className="flex items-start gap-2 rounded-[10px] px-3 py-2.5"
        style={{ background: "rgba(251, 183, 3, 0.08)", border: "1px solid rgba(251,183,3,0.2)" }}
      >
        <ShieldCheck size={13} color="#FFB703" className="flex-shrink-0 mt-[2px]" />
        <span style={{ fontSize: 11, color: "#C4AF6B", lineHeight: 1.5 }}>
          Спишется $0.50 и будет немедленно возвращён. Платёж подтверждает, что вы взрослый (COPPA).
        </span>
      </div>

      {/* Error */}
      {errMsg && (
        <div
          className="flex items-start gap-2 rounded-[10px] px-3 py-2.5"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <AlertCircle size={13} color="#EF4444" className="flex-shrink-0 mt-[1px]" />
          <span style={{ fontSize: 12, color: "#FCA5A5" }}>{errMsg}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!stripe || status === "processing"}
        className="w-full flex items-center justify-center gap-2 rounded-[18px] py-[15px] text-[15px] font-bold transition-opacity disabled:opacity-60"
        style={{
          background: "linear-gradient(180deg, #FFB703 0%, #FF8C00 100%)",
          color: "#0F0A2E",
        }}
      >
        {status === "processing" ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Обрабатываем…
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            Подтвердить — $0.50
          </>
        )}
      </button>
    </form>
  );
}

// ── Экран успеха ──────────────────────────────────────────────────────────────

function SuccessScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: 72, height: 72,
          background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
        }}
      >
        <Check size={36} color="#fff" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-white text-[22px] font-bold">Верификация пройдена!</span>
        <span style={{ fontSize: 14, color: "#9B8EC4", lineHeight: 1.6 }}>
          $0.50 будут возвращены в течение нескольких минут.<br />
          Теперь вы можете создавать профили детей.
        </span>
      </div>
      <button
        onClick={onContinue}
        className="w-full flex items-center justify-center gap-2 rounded-[18px] py-[14px] text-white text-[15px] font-bold"
        style={{ background: "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)" }}
      >
        Перейти в личный кабинет
      </button>
    </div>
  );
}

// ── Шаги слева / вверху ───────────────────────────────────────────────────────

function StepsList() {
  const steps = [
    { label: "Введите данные карты",       sub: "Форма защищена Stripe — данные карты нам не передаются" },
    { label: "Безопасный платёж $0.50",    sub: "Символическая сумма для подтверждения возраста" },
    { label: "Немедленный возврат",        sub: "Средства зачисляются обратно в течение минут", green: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      {steps.map((s, i) => (
        <div key={i} className="flex items-start gap-3">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white"
            style={{
              width: 28, height: 28, fontSize: 12,
              background: s.green ? "#22C55E" : "#7B2FFF",
            }}
          >
            {s.green ? <Check size={13} strokeWidth={2.5} /> : i + 1}
          </div>
          <div className="flex flex-col gap-0.5 pt-[3px]">
            <span className="text-white font-semibold" style={{ fontSize: 13 }}>{s.label}</span>
            <span style={{ fontSize: 11, color: "#6B5A9A", lineHeight: 1.5 }}>{s.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Основной компонент страницы ───────────────────────────────────────────────

export default function VerifyCoppaPage() {
  const router = useRouter();

  const [phase,         setPhase]         = useState<"loading" | "form" | "success" | "already">("loading");
  const [clientSecret,  setClientSecret]  = useState<string | null>(null);
  const [initError,     setInitError]     = useState<string | null>(null);

  const init = useCallback(async () => {
    setPhase("loading");
    setInitError(null);
    try {
      const { clientSecret: cs } = await createCoppaIntent();
      setClientSecret(cs);
      setPhase("form");
    } catch (err: any) {
      if (err instanceof AuthError) {
        router.replace("/login");
        return;
      }
      // 409 = уже верифицирован
      if (err?.statusCode === 409) {
        setPhase("already");
        return;
      }
      setInitError(err?.message ?? "Не удалось запустить верификацию");
      setPhase("loading"); // останемся в загрузке, покажем ошибку
    }
  }, [router]);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div
      className="min-h-screen flex items-start lg:items-center justify-center p-4 lg:p-8"
      style={{ background: "#0F0A2E" }}
    >
      <div className="w-full max-w-[900px] flex flex-col lg:flex-row gap-6 lg:gap-10">

        {/* ── LEFT / TOP panel ── */}
        <div className="flex flex-col gap-6 lg:w-[340px] flex-shrink-0">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 self-start"
            style={{ color: "#9B8EC4", fontSize: 14 }}
          >
            <ArrowLeft size={16} />
            Назад
          </button>

          {/* Header */}
          <div className="flex flex-col gap-3">
            <div
              className="flex items-center justify-center rounded-[20px] self-start"
              style={{
                width: 52, height: 52,
                background: "linear-gradient(135deg, #FFB703 0%, #FF8C00 100%)",
              }}
            >
              <ShieldCheck size={26} color="#0F0A2E" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white text-[24px] lg:text-[28px] font-bold leading-snug">
                Верификация родителя
              </span>
              <span style={{ fontSize: 14, color: "#9B8EC4", lineHeight: 1.6 }}>
                Одноразовая процедура для защиты данных ребёнка по закону COPPA
              </span>
            </div>
          </div>

          {/* Steps (hidden on mobile to save space) */}
          <div className="hidden lg:block">
            <StepsList />
          </div>

          {/* Trust badges */}
          <div
            className="hidden lg:grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-[14px] px-4 py-3"
            style={{ background: "#1A1050" }}
          >
            {[
              "Данные карты не хранятся",
              "Соответствует COPPA",
              "Защищено Stripe",
              "Возврат в течение минут",
            ].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <Check size={11} color="#22C55E" />
                <span style={{ fontSize: 11, color: "#9B8EC4" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT / BOTTOM panel — форма ── */}
        <div
          className="flex-1 flex flex-col rounded-[20px] lg:rounded-[24px] p-5 lg:p-8"
          style={{ background: "#1C1740", border: "1.5px solid #2D1B6B" }}
        >
          {/* Loading */}
          {phase === "loading" && !initError && (
            <div className="flex flex-col items-center justify-center gap-4 py-10">
              <Loader2 size={32} color="#7B2FFF" className="animate-spin" />
              <span style={{ fontSize: 14, color: "#9B8EC4" }}>Подготовка формы оплаты…</span>
            </div>
          )}

          {/* Init error */}
          {phase === "loading" && initError && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <AlertCircle size={32} color="#EF4444" />
              <span style={{ fontSize: 14, color: "#FCA5A5" }}>{initError}</span>
              <button
                onClick={init}
                className="flex items-center gap-2 rounded-[14px] px-5 py-2.5 text-white text-[13px] font-semibold"
                style={{ background: "#2D1B6B" }}
              >
                Попробовать снова
              </button>
            </div>
          )}

          {/* Already verified */}
          {phase === "already" && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 60, height: 60, background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)" }}
              >
                <Check size={28} color="#fff" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-white text-[18px] font-bold">Уже верифицирован</span>
                <span style={{ fontSize: 13, color: "#9B8EC4" }}>
                  Ваш аккаунт уже прошёл COPPA верификацию.
                </span>
              </div>
              <button
                onClick={() => router.replace("/home")}
                className="flex items-center gap-2 rounded-[14px] px-6 py-2.5 text-white text-[13px] font-semibold"
                style={{ background: "linear-gradient(180deg, #7B2FFF 0%, #4F46E5 100%)" }}
              >
                Перейти в кабинет
              </button>
            </div>
          )}

          {/* Stripe form */}
          {phase === "form" && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#7B2FFF",
                    colorBackground: "#261F4A",
                    colorText: "#FFFFFF",
                    colorTextSecondary: "#9B8EC4",
                    colorDanger: "#EF4444",
                    fontFamily: "Inter, system-ui, sans-serif",
                    borderRadius: "10px",
                  },
                  rules: {
                    ".Input": {
                      border: "1px solid #3D2F7A",
                      backgroundColor: "#1A1050",
                    },
                    ".Input:focus": {
                      border: "1px solid #7B2FFF",
                      boxShadow: "0 0 0 2px rgba(123,47,255,0.2)",
                    },
                    ".Label": {
                      color: "#9B8EC4",
                      fontSize: "12px",
                    },
                  },
                },
              }}
            >
              <CoppaPaymentForm onSuccess={() => setPhase("success")} />
            </Elements>
          )}

          {/* Success */}
          {phase === "success" && (
            <SuccessScreen onContinue={() => router.replace("/home")} />
          )}
        </div>
      </div>
    </div>
  );
}
