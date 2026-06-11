"use client";

import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSwitcher() {
  const { locale, setLocale, locales } = useI18n();

  return (
    <Select value={locale} onValueChange={(v) => setLocale(v)}>
      <SelectTrigger className="h-8 w-auto gap-1 border-white/10 bg-transparent text-white/60 hover:text-white hover:bg-white/5 text-xs px-2">
        <Globe className="h-3.5 w-3.5" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-[#2a2a2d] border-white/10">
        {locales.map((l) => (
          <SelectItem key={l.code} value={l.code} className="text-white/70 focus:text-white focus:bg-white/5">
            {l.nativeName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
