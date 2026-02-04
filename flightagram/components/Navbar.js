"use client";
import { Logo } from "./Logo";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/src/i18n/navigation";

export default function Navbar() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const changeLang = (newLang) => {
    router.replace(pathname, { locale: newLang });
  };

  const lang = locale;
    return (
        <nav className="flex justify-between items-center px-6 py-4 bg-dark text-white">
            <Logo showText={true} />

            {/* Language Toggle */}
            <div className="relative flex bg-white/10 rounded-full p-1 w-26 h-8 cursor-pointer select-none transition-all duration-300 ease-in-out">
                <div
                    className={`absolute top-1 left-1 w-12 h-6 rounded-full bg-white/20 backdrop-blur-md transition-all duration-300 ease-in-out ${
                        lang === "hu" ? "translate-x-12" : "translate-x-0"
                    }`}
                />
                <button
                    onClick={() => changeLang("en")}
                    className={`flex-1 text-sm font-semibold z-10 transition-all duration-200 cursor-pointer ${
                        lang === "en" ? "text-white" : "text-white/60"
                    }`}
                >
                    EN
                </button>
                <button
                    onClick={() => changeLang("hu")}
                    className={`flex-1 text-sm font-semibold z-10 transition-all duration-200 cursor-pointer ${
                        lang === "hu" ? "text-white" : "text-white/60"
                    }`}
                >
                    HU
                </button>
            </div>
        </nav>
    );
}
