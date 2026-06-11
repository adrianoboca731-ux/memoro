"use client";

import { Camera, Sparkles, ArrowRight, Upload, Users, Globe } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

type PromoVariant = "leaderboard" | "rectangle" | "banner";

interface PromoBannerProps {
  variant?: PromoVariant;
  className?: string;
}

const messages = [
  {
    icon: Camera,
    title: "Memoro — Free Photo Sharing",
    subtitle: "Unlimited space, no limits. Join the community!",
    cta: "Sign Up Free",
    href: "/auth/registrati",
    gradient: "from-[#0063dc]/20 to-[#ff0084]/20",
  },
  {
    icon: Sparkles,
    title: "Share Your Best Shots",
    subtitle: "Upload unlimited photos for free on Memoro.",
    cta: "Get Started",
    href: "/auth/registrati",
    gradient: "from-[#ff0084]/20 to-[#0063dc]/20",
  },
  {
    icon: Users,
    title: "Join Photographers Worldwide",
    subtitle: "Create galleries, join groups, share your passion.",
    cta: "Join Now",
    href: "/auth/registrati",
    gradient: "from-[#0063dc]/15 to-[#ff0084]/15",
  },
  {
    icon: Globe,
    title: "Memoro — 10 Languages",
    subtitle: "The free photo platform for everyone, everywhere.",
    cta: "Explore",
    href: "/esplora",
    gradient: "from-[#ff0084]/15 to-[#0063dc]/15",
  },
];

export function PromoBanner({ variant = "leaderboard", className = "" }: PromoBannerProps) {
  // Pick a message based on variant to keep it consistent per placement
  const msgIndex = variant === "rectangle" ? 2 : variant === "banner" ? 1 : 0;
  const msg = messages[msgIndex];
  const Icon = msg.icon;

  if (variant === "rectangle") {
    return (
      <div className={`my-4 ${className}`}>
        <Link href={msg.href}>
          <motion.div
            className={`rounded-xl bg-gradient-to-br ${msg.gradient} border border-white/10 p-5 hover:border-white/20 transition-all cursor-pointer group`}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0063dc] to-[#ff0084] flex items-center justify-center">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-white/80 font-semibold text-sm">{msg.title}</span>
            </div>
            <p className="text-white/40 text-xs leading-relaxed mb-3">{msg.subtitle}</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#ff0084] group-hover:text-[#ff0084]/80 transition-colors">
              {msg.cta}
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </motion.div>
        </Link>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className={`my-4 ${className}`}>
        <Link href={msg.href}>
          <motion.div
            className={`rounded-lg bg-gradient-to-r ${msg.gradient} border border-white/10 px-5 py-3 hover:border-white/20 transition-all cursor-pointer group flex items-center justify-between gap-4`}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#0063dc] to-[#ff0084] flex items-center justify-center shrink-0">
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <span className="text-white/80 font-medium text-sm">{msg.title}</span>
                <span className="text-white/30 text-xs ml-2 hidden sm:inline">{msg.subtitle}</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#ff0084] shrink-0 group-hover:text-[#ff0084]/80 transition-colors">
              {msg.cta}
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </motion.div>
        </Link>
      </div>
    );
  }

  // Leaderboard (default)
  return (
    <div className={`my-4 ${className}`}>
      <Link href={msg.href}>
        <motion.div
          className={`rounded-xl bg-gradient-to-r ${msg.gradient} border border-white/10 px-6 py-4 hover:border-white/20 transition-all cursor-pointer group flex items-center justify-center gap-4 flex-wrap`}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0063dc] to-[#ff0084] flex items-center justify-center shadow-lg shadow-[#0063dc]/20">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <div className="text-center sm:text-left">
            <span className="text-white font-bold text-lg">Memoro</span>
            <span className="text-white/50 text-sm ml-2">{msg.subtitle}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#ff0084] bg-[#ff0084]/10 px-4 py-1.5 rounded-full group-hover:bg-[#ff0084]/20 transition-colors">
            {msg.cta}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </motion.div>
      </Link>
    </div>
  );
}
