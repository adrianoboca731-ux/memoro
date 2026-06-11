"use client";

import { Header } from "@/components/header";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import {
  Heart,
  Unlock,
  Globe,
  Eye,
  Download,
  HardDrive,
  User,
} from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function ChiSiamoPage() {
  const { t } = useI18n();

  const values = [
    {
      icon: Unlock,
      title: t("about.value1Title"),
      text: t("about.value1Text"),
      gradient: "from-[#0063dc] to-[#0099ff]",
    },
    {
      icon: Heart,
      title: t("about.value2Title"),
      text: t("about.value2Text"),
      gradient: "from-[#ff0084] to-[#ff4da6]",
    },
    {
      icon: Globe,
      title: t("about.value3Title"),
      text: t("about.value3Text"),
      gradient: "from-[#00c853] to-[#69f0ae]",
    },
    {
      icon: Eye,
      title: t("about.value4Title"),
      text: t("about.value4Text"),
      gradient: "from-[#ff6d00] to-[#ffab40]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
        {/* Title */}
        <motion.div {...fadeIn} className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {t("about.title")}
          </h1>
          <p className="text-lg text-white/50">
            {t("about.subtitle")}
          </p>
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-8 mb-20"
        >
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#0063dc] to-[#ff0084] rounded-full" />
            <div className="pl-6 sm:pl-8 space-y-8">
              <p className="text-white/80 text-base sm:text-lg leading-relaxed">
                {t("about.story")}
              </p>
              <p className="text-white/80 text-base sm:text-lg leading-relaxed">
                {t("about.story2")}
              </p>
              <p className="text-white/80 text-base sm:text-lg leading-relaxed">
                {t("about.story3")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <div className="bg-gradient-to-br from-[#0063dc]/10 to-[#ff0084]/10 rounded-2xl p-8 sm:p-12 border border-white/5">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              {t("about.mission")}
            </h2>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed">
              {t("about.missionText")}
            </p>
          </div>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
            {t("about.values")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="bg-white/[0.03] border border-white/5 rounded-xl p-6 hover:bg-white/[0.06] transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${value.gradient} flex items-center justify-center mb-4`}
                >
                  <value.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {value.text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Storage Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-20"
        >
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0063dc] to-[#ff0084] flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {t("about.storageTitle")}
              </h2>
            </div>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed">
              {t("about.storageText")}
            </p>
            <div className="mt-6 flex items-center gap-4 text-white/40 text-sm">
              <span className="flex items-center gap-1.5">
                <Download className="h-4 w-4 text-[#0063dc]" />
                ZIP
              </span>
              <span className="text-white/20">|</span>
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-[#ff0084]" />
                {t("about.storage")}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Founder Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
            {t("about.founder")}
          </h2>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-8 sm:p-10 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0063dc] to-[#ff0084] flex items-center justify-center mx-auto mb-6">
              <User className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">
              {t("about.founderName")}
            </h3>
            <p className="text-[#0063dc] text-sm font-medium mb-4">
              {t("about.founderRole")}
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              {t("about.founderBio")}
            </p>
          </div>
        </motion.div>
      </main>

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
