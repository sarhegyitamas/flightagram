import type { Metadata } from "next";
import '@/styles/globals.css';
import Script from 'next/script';
import { Toaster } from '@/components/ui/sonner';
import { NextIntlClientProvider, hasLocale } from "next-intl";
import {notFound} from 'next/navigation';
import {routing} from '@/src/i18n/routing';

export const metadata: Metadata = {
  title: "Flightagram",
  description: "Connect...",
};

type Props = {
  children: React.ReactNode;
  params: Promise<{lang: string}>;
};

export default async function LocaleLayout({children, params}: Props) {
  const {lang} = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }

  return (
    <html lang={lang} className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Script
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="a50e9601-1526-4e6a-b5a7-23dfa9ad47a1"
          data-blockingmode="auto"
          type="text/javascript"
          strategy="beforeInteractive"
        />

        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-LP7TZ0DV1V"
          strategy="beforeInteractive"
        />
        <Script src="/scripts/script.js" strategy="beforeInteractive" />

        <NextIntlClientProvider>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
