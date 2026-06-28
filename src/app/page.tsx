import { Header } from "@/components/site/header";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { Footer } from "@/components/site/footer";
import { Router } from "@/components/site/router";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <ScrollProgress />
      <Header />

      <main className="flex-1">
        <Router />
      </main>

      <Footer />
    </div>
  );
}
