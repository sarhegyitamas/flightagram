"use client";
import { useLocale, useTranslations } from "next-intl";
import { Logo } from "@/components/Logo";

export default function Footer() {
  const lang = useLocale();
  const t = useTranslations('landing.footer');

  return (
    
    <footer className="py-12 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          
          <nav className="flex gap-8 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('about')}
            </a>
            <a href={`/assets/docs/Flightagram_Privacy_waitlist_${lang}.pdf`} target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('privacy')}
            </a>
            <a href="mailto:hello@flightagram.com" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('contact')}
            </a>
          </nav>
          
          <p className="text-sm text-muted-foreground">
            {t('madeWithCare')}
          </p>
        </div>
      </div>
    </footer>
  );
}
