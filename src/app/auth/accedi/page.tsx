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

export default function AccediPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t("auth.loginError"));
      setLoading(false);
    } else {
      router.push("/");
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
            {t("auth.loginTitle")}{" "}
            <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent">
              Memoro
            </span>
          </h1>
          <p className="text-white/40 text-sm">
            {t("auth.loginWelcome")}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              {error}
            </div>
          )}

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
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg focus-visible:ring-[#0063dc]/50"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white font-medium rounded-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("auth.loggingIn")}
              </>
            ) : (
              t("auth.loginButton")
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-white/40">
          {t("auth.noAccount")}{" "}
          <Link
            href="/auth/registrati"
            className="text-[#0063dc] hover:underline font-medium"
          >
            {t("auth.registerFree")}
          </Link>
        </p>
      </div>
    </div>
  );
}
