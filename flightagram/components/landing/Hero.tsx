"use client";

import { Button } from "@/components/ui/button";
import { Plane, Search } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

export const Hero = () => {
  const t = useTranslations("landing");
  const locale = useLocale();

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center bg-gradient-calm bg-map-texture overflow-hidden">
      {/* Floating gradient orbs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Hero Content */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Plane className="w-4 h-4" />
            <span className="text-sm font-medium">{t("trustBadge")}</span>
          </div>

          {/* Hero Title with gradient text */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight font-heading">
            <span className="text-gradient block mb-2">
              {t("heroTitle")}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {t("heroSubtitle")}
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button
              asChild
              size="lg"
              variant="hero"
              className="text-lg px-10 h-16 min-w-[280px]"
            >
              <Link href={`/${locale}/auth/register`}>
                <Plane className="w-6 h-6" />
                {t("ctaSender")}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-10 h-16 min-w-[280px]"
            >
              <Link href={`/${locale}/track`}>
                <Search className="w-6 h-6" />
                {t("ctaTracker")}
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            {t('trustBadge')}
          </p>
        </div>
      </div>
    </div>
  );
};
