"use client";

import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Icon className="h-16 w-16 mb-4 opacity-30" />
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm mt-1 max-w-md text-center">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-4 bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
