import { Header } from "@/components/site/header";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { Footer } from "@/components/site/footer";
import { Router } from "@/components/site/router";
import { I18nBootstrap } from "@/components/site/i18n-bootstrap";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <I18nBootstrap />
      <ScrollProgress />
      <Header />

      <main className="flex-1">
        <div className="border-b border-border/60 bg-card/40 px-5 py-2.5 text-center text-sm">
          <a
            href="/gptadmin-win.zip"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Скачать готовую Windows-сборку GPT‑Админ (.zip)
          </a>
          <span className="px-2 text-muted-foreground">·</span>
          <a
            href="/gptadmin-win.zip.sha256"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            SHA-256
          </a>
        </div>
        <Router />
      </main>

      <Footer />
    </div>
  );
}
