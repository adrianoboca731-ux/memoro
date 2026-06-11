"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function RegisterPage() {
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
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t("common.error")); return; }
      await signIn("credentials", { email, password, redirect: false });
      router.push("/");
    } catch { setError(t("auth.connectionError")); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#212124] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#0063dc] flex items-center justify-center"><Camera className="h-6 w-6 text-white" /></div>
          </div>
          <h1 className="text-2xl font-bold text-white">{t("auth.registerTitle")} <span className="text-[#ff0084]">Memoro</span></h1>
          <p className="text-white/50 text-sm mt-1">{t("auth.registerAltSubtitle")}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-red-400 text-sm text-center bg-red-400/10 rounded p-2">{error}</p>}
          <Input placeholder={t("auth.name")} value={name} onChange={(e) => setName(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11" />
          <Input placeholder={t("auth.username")} value={username} onChange={(e) => setUsername(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11" />
          <Input type="email" placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11" />
          <Input type="password" placeholder={t("auth.passwordMin")} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11" />
          <Button type="submit" disabled={loading} className="w-full h-11 bg-[#0063dc] hover:bg-[#0052b5] text-white font-medium">{loading ? t("auth.registering") : t("auth.registerButton")}</Button>
        </form>
        <p className="text-center text-sm text-white/50">{t("auth.hasAccount")} <Link href="/login" className="text-[#0063dc] hover:underline">{t("auth.loginHere")}</Link></p>
      </div>
    </div>
  );
}
