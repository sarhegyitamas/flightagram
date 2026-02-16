"use client";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl";
import { useRouter, usePathname, Link } from "@/src/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PageHeader() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const changeLang = (newLang) => {
    router.replace(pathname, { locale: newLang });
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Logo showText={true} size="sm" />
      </div>

      <div className="flex items-center gap-4">
        {!loading && user && (
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Log out
          </button>
        )}

        <div className="flex gap-1 bg-muted/50 rounded-full p-1">
          <Button
            variant={locale === "en" ? "default" : "ghost"}
            size="sm"
            onClick={() => changeLang("en")}
            className="rounded-full px-3 h-8 text-xs font-medium"
          >
            EN
          </Button>
          <Button
            variant={locale === "hu" ? "default" : "ghost"}
            size="sm"
            onClick={() => changeLang("hu")}
            className="rounded-full px-3 h-8 text-xs font-medium"
          >
            HU
          </Button>
        </div>
      </div>
    </header>
  );
}
