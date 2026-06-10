"use client";

import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, ShieldAlert } from "lucide-react";

interface SafetyBadgeProps {
  level: string;
  size?: "sm" | "default";
}

const config: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  safe: { label: "Sicuro", color: "bg-green-500/80 text-white", icon: Shield },
  moderate: { label: "Moderato", color: "bg-yellow-500/80 text-black", icon: AlertTriangle },
  restricted: { label: "Restretto", color: "bg-red-500/80 text-white", icon: ShieldAlert },
};

export function SafetyBadge({ level, size = "sm" }: SafetyBadgeProps) {
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
