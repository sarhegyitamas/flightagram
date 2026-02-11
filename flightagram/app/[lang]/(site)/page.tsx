import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { QuickDemo } from "@/components/landing/QuickDemo";
import { MessagePreview } from "@/components/landing/MessagePreview";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <MessagePreview />
      <QuickDemo />
    </main>
  );
}
