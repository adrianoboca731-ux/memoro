"use client";

import { useSession } from "next-auth/react";
import { Header } from "@/components/header";
import { Camera, ArrowRight, Sparkles, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";


// Hero section for logged-out users
function HeroSection() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0063dc]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ff0084]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0063dc] to-[#ff0084] flex items-center justify-center shadow-lg shadow-[#0063dc]/30">
                <Camera className="h-9 w-9 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
              {t("home.heroTitle")}
            </h1>
          </motion.div>

          <motion.p
            className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {t("home.heroSubtitle")}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/auth/registrati">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white font-semibold px-8 h-12 text-base rounded-lg shadow-lg shadow-[#0063dc]/25"
              >
                {t("home.getStart")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/accedi">
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/5 h-12 px-8 text-base rounded-lg"
              >
                {t("auth.loginButton")}
              </Button>
            </Link>
          </motion.div>

          <motion.div
            className="flex items-center justify-center gap-6 pt-4 text-white/30 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#ff0084]" />
              {t("home.unlimitedSpace")}
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-[#ff0084]" />
              {t("home.completelyFree")}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#ff0084]" />
              {t("home.globalCommunity")}
            </span>
          </motion.div>
        </div>
      </section>

      {/* Featured photos section */}
      <section className="bg-[#0d0d0d] px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-white/20 text-sm uppercase tracking-widest mb-8">
            {t("home.discoverPhotos")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg overflow-hidden bg-white/5"
              >
                <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-4 text-center">
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">
          Memoro
        </span>
        <span className="text-white/20 text-sm ml-2">
          &mdash; {t("home.footerTagline")}
        </span>
      </footer>
    </div>
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  // Redirect logged-in users to explore page
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace("/esplora");
    }
  }, [status, session, router]);

  // Show loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0063dc] to-[#ff0084] flex items-center justify-center animate-pulse">
            <Camera className="h-4 w-4 text-white" />
          </div>
          <span className="text-white/40 text-sm">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  // Not authenticated - show hero
  if (!session) {
    return <HeroSection />;
  }

  // Authenticated but redirecting - show loading
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0063dc] to-[#ff0084] flex items-center justify-center animate-pulse">
          <Camera className="h-4 w-4 text-white" />
        </div>
        <span className="text-white/40 text-sm">{t("common.redirecting")}</span>
      </div>
    </div>
  );
}
