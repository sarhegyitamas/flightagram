"use client";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { useLocale } from "next-intl";
import { useRouter, usePathname, Link } from "@/src/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
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

    const lang = locale;

    return (
        <nav className="flex justify-between items-center px-6 py-4 bg-dark text-white">
            <div className="flex items-center gap-8">
                <Logo showText={true} />

                {/* Navigation Links */}
                <div className="hidden md:flex items-center gap-6">
                    <Link
                        href="/track"
                        className={`text-sm font-medium transition-colors ${
                            pathname === "/track"
                                ? "text-white"
                                : "text-white/60 hover:text-white"
                        }`}
                    >
                        Track Flight
                    </Link>
                    {user && (
                        <Link
                            href="/dashboard"
                            className={`text-sm font-medium transition-colors ${
                                pathname === "/dashboard"
                                    ? "text-white"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            Dashboard
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Auth Buttons */}
                {!loading && (
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                            >
                                Log out
                            </button>
                        ) : (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg hover:opacity-90 transition-all"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                )}

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
            </div>
        </nav>
    );
}
