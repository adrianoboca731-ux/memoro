"use client";

import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, ShieldAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface SafetyBadgeProps {
  level: string;
  size?: "sm" | "default";
}

export function SafetyBadge({ level, size = "sm" }: SafetyBadgeProps) {
  const { t } = useI18n();

  const config: Record<string, { label: string; color: string; icon: typeof Shield }> = {
    safe: { label: t("safety.safe"), color: "bg-green-500/80 text-white", icon: Shield },
    moderate: { label: t("safety.moderate"), color: "bg-yellow-500/80 text-black", icon: AlertTriangle },
    restricted: { label: t("safety.restricted"), color: "bg-red-500/80 text-white", icon: ShieldAlert },
  };

  const c = config[level] || config.safe;
  const Icon = c.icon;

  return (
    <Badge
      className={`${c.color} gap-1 border-0 ${
        size === "sm" ? "text-[10px] h-5 px-1.5" : "text-xs h-6 px-2"
      }`}
    >
      <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {c.label}
    </Badge>
  );
}
