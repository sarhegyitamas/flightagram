"use client";
import { useLocale, useTranslations } from "next-intl";
import { Copyright } from "lucide-react";

export default function Footer() {
  const lang = useLocale();
  const t = useTranslations('waitlist');

  return (
    <footer className="bg-dark text-white text-center py-6 text-sm opacity-75">
      <div className="mx-auto md:w-[60vw]">
        <div className="m-3">
          <Copyright
            className="h-4 w-4 mr-3"
            style={{ color: "white", display: "inline-block" }}
          />
          2025 {t("brandName")} |{" "}
          <a
            href={`/assets/docs/Flightagram_Terms_waitlist_${lang}.pdf`}
            target="_blank"
          >
            {t("terms")}
          </a>{" "}
          |{" "}
          <a
            href={`/assets/docs/Flightagram_Privacy_waitlist_${lang}.pdf`}
            target="_blank"
          >
            {t("privacy")}
          </a>{" "}
          | <a href="mailto:hello@flightagram.com">{t("contact")}</a>
        </div>
      </div>
    </footer>
  );
}
