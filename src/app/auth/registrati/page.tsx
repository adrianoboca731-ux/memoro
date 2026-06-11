"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function RegistratiPage() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("auth.registerError"));
        setLoading(false);
        return;
      }

      // Auto sign in after registration
      await signIn("credentials", { email, password, redirect: false });
      router.push("/");
    } catch {
      setError(t("auth.connectionError"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0063dc] to-[#ff0084] flex items-center justify-center shadow-lg shadow-[#0063dc]/20">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">
            {t("auth.registerTitle")}{" "}
            <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent">
              Memoro
            </span>
          </h1>
          <p className="text-white/40 text-sm">
            {t("auth.registerSubtitle")}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/60 text-sm">
              {t("auth.name")}
            </Label>
            <Input
              id="name"
              placeholder={t("auth.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg focus-visible:ring-[#0063dc]/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-white/60 text-sm">
              {t("auth.username")}
            </Label>
            <Input
              id="username"
              placeholder={t("auth.usernamePlaceholder")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg focus-visible:ring-[#0063dc]/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/60 text-sm">
              {t("auth.email")}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg focus-visible:ring-[#0063dc]/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/60 text-sm">
              {t("auth.password")}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={t("auth.passwordMin")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg focus-visible:ring-[#0063dc]/50"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white font-medium rounded-lg mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("auth.registering")}
              </>
            ) : (
              t("auth.registerButton")
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-white/40">
          {t("auth.hasAccount")}{" "}
          <Link
            href="/auth/accedi"
            className="text-[#0063dc] hover:underline font-medium"
          >
            {t("auth.loginHere")}
          </Link>
        </p>
      </div>
    </div>
  );
}
