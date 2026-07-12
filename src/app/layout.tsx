import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LOCALE_BOOTSTRAP_SCRIPT } from "@/hooks/use-locale";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const SITE_URL = "https://gptadmin.bezrabotnyi.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "GPT‑Админ — AI-администратор серверов, который делает, а не советует",
  description:
    "GPT‑Админ подключает ChatGPT к вашим серверам: выполняет команды, ставит софт, правит конфиги, анализирует логи и следит за сервисами. Linux, macOS, Windows. Установка за 1 минуту.",
  keywords: [
    "GPT-Админ", "GPTAdmin", "ChatGPT", "администрирование серверов",
    "MCP", "server administration", "Linux", "nginx", "automation",
  ],
  authors: [{ name: "GPT‑Админ" }],
  creator: "GPT‑Админ",
  applicationName: "GPT‑Админ",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
  },
  openGraph: {
    title: "GPT‑Админ — AI-администратор серверов",
    description:
      "Подключите ChatGPT к своим серверам: GPT‑Админ ставит софт, правит конфиги, перезапускает сервисы и читает логи. Никаких копипаст — всё автоматически.",
    url: SITE_URL,
    siteName: "GPT‑Админ",
    type: "website",
    locale: "ru_RU",
    images: [
      {
        url: "/og-image.png",
        width: 1344,
        height: 768,
        alt: "GPT‑Админ — AI-администратор серверов",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GPT‑Админ — AI-администратор серверов",
    description:
      "Подключите ChatGPT к своим серверам: выполнение команд, правка конфигов, логи — автоматически.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#0a0c0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <head>
        {/*
          Run before React hydration so the first paint already reflects the
          user's preferred language (localStorage → navigator.language → ru).
          Without this, an English visitor sees a flash of Russian chrome on
          first visit because the server has no way to know the browser locale.
          Inline so we don't pay a network round-trip before paint.
        */}
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOTSTRAP_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased bg-background text-foreground grain`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
