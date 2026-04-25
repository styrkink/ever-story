import "./globals.css";
import { Inter } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: '--font-inter' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "vash_google_client_id_zdes";

  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
        <GoogleOAuthProvider clientId={googleClientId}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
