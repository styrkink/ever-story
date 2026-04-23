import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация — EverStory",
  description: "Создайте аккаунт и начните создавать персонализированные сказки для своих детей",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
