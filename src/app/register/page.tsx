"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function RegisterPage() {
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
      if (!res.ok) { setError(data.error || "Errore"); return; }
      await signIn("credentials", { email, password, redirect: false });
      router.push("/");
    } catch { setError("Errore di connessione"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#212124] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#0063dc] flex items-center justify-center"><Camera className="h-6 w-6 text-white" /></div>
          </div>
          <h1 className="text-2xl font-bold text-white">Crea il tuo account <span className="text-[#ff0084]">Memoro</span></h1>
          <p className="text-white/50 text-sm mt-1">Gratis per sempre • 1TB di spazio</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-red-400 text-sm text-center bg-red-400/10 rounded p-2">{error}</p>}
          <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11" />
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11" />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11" />
          <Input type="password" placeholder="Password (min 6 caratteri)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11" />
          <Button type="submit" disabled={loading} className="w-full h-11 bg-[#0063dc] hover:bg-[#0052b5] text-white font-medium">{loading ? "Registrazione..." : "Registrati gratis"}</Button>
        </form>
        <p className="text-center text-sm text-white/50">Hai già un account? <Link href="/login" className="text-[#0063dc] hover:underline">Accedi</Link></p>
      </div>
    </div>
  );
}
