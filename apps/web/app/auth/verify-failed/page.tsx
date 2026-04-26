"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Mail } from "lucide-react";

const REASONS: Record<string, { title: string; body: string }> = {
  invalid: {
    title: "Ссылка недействительна",
    body: "Эта ссылка для подтверждения email уже использована, истёк её срок (24 часа) или она неверна. Попробуйте запросить новую ссылку.",
  },
  expired: {
    title: "Ссылка истекла",
    body: "Срок действия ссылки истёк. Запросите новую ссылку для подтверждения email.",
  },
};

function VerifyFailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") ?? "invalid";
  const { title, body } = REASONS[reason] ?? REASONS.invalid;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6"
      style={{ background: "#0F0A2E" }}
    >
      <div
        className="flex flex-col items-center gap-6 rounded-[24px] p-8 max-w-md w-full"
        style={{ background: "#1A1050", border: "1px solid #2D1B6B" }}
      >
        <div
          className="flex items-center justify-center rounded-[40px] flex-shrink-0"
          style={{
            width: 80,
            height: 80,
            background: "linear-gradient(135deg, #FF6B9D 0%, #7B2FFF 100%)",
          }}
        >
          <AlertCircle size={36} color="#FFFFFF" />
        </div>

        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-white text-[26px] font-bold leading-tight">{title}</h1>
          <p className="text-[#9B8EC4] text-[14px] leading-relaxed">{body}</p>
        </div>

        <Link
          href="/verify-email"
          className="w-full flex items-center justify-center gap-[10px] rounded-[28px] text-white text-[16px] font-bold"
          style={{
            height: 56,
            background: "linear-gradient(90deg, #7B2FFF 0%, #4F46E5 100%)",
          }}
        >
          <Mail size={18} />
          Запросить новую ссылку
        </Link>

        <Link href="/login" className="text-[#C4B5FD] text-[13px] hover:underline">
          Вернуться ко входу
        </Link>
      </div>
    </div>
  );
}

export default function VerifyFailedPage() {
  return (
    <Suspense>
      <VerifyFailedContent />
    </Suspense>
  );
}
