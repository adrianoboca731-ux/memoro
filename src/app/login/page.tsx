"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setError(t("auth.loginError")); }
    else { router.push("/"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#212124] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#0063dc] flex items-center justify-center"><Camera className="h-6 w-6 text-white" /></div>
          </div>
          <h1 className="text-2xl font-bold text-white">{t("auth.loginTitle")} <span className="text-[#ff0084]">Memoro</span></h1>
          <p className="text-white/50 text-sm mt-1">{t("auth.loginAltSubtitle")}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-400 text-sm text-center bg-red-400/10 rounded p-2">{error}</p>}
          <Input type="email" placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11" />
          <Input type="password" placeholder={t("auth.password")} value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11" />
          <Button type="submit" disabled={loading} className="w-full h-11 bg-[#0063dc] hover:bg-[#0052b5] text-white font-medium">{loading ? t("auth.accessing") : t("auth.loginButton")}</Button>
        </form>
        <p className="text-center text-sm text-white/50">{t("auth.noAccount")} <Link href="/register" className="text-[#0063dc] hover:underline">{t("auth.registerFree")}</Link></p>
      </div>
    </div>
  );
}
