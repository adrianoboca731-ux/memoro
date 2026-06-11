"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface FollowButtonProps {
  userId: string;
  username: string;
  initialFollowing?: boolean;
  isPrivate?: boolean;
  followStatus?: string | null; // "pending", "approved", "rejected", null
  size?: "sm" | "default";
  onStatusChange?: (following: boolean, status: string | null) => void;
}

export function FollowButton({
  userId,
  username,
  initialFollowing = false,
  isPrivate = false,
  followStatus = null,
  size = "sm",
  onStatusChange,
}: FollowButtonProps) {
  const { data: session } = useSession();
  const { t } = useI18n();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [currentStatus, setCurrentStatus] = useState<string | null>(followStatus);
  const [isLoading, setIsLoading] = useState(false);

  const currentUserId = (session?.user as any)?.id;
  const isOwnProfile = currentUserId === userId;

  // Determine the display state
  const isPending = currentStatus === "pending";
  const isApproved = isFollowing && currentStatus === "approved";

  const handleToggleFollow = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isLoading || !session) return;
      setIsLoading(true);
      try {
        if (isFollowing || isPending) {
          // Unfollow or cancel pending request
          const res = await fetch(`/api/users/${username}/follow`, {
            method: "DELETE",
          });
          if (res.ok) {
            setIsFollowing(false);
            setCurrentStatus(null);
            onStatusChange?.(false, null);
          }
        } else {
          // Follow
          const res = await fetch(`/api/users/${username}/follow`, {
            method: "POST",
          });
          if (res.ok) {
            const data = await res.json();
            setIsFollowing(data.following);
            setCurrentStatus(data.status || null);
            onStatusChange?.(data.following, data.status || null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [username, isFollowing, isPending, isLoading, session, onStatusChange]
  );

  if (!session || isOwnProfile) return null;

  // Pending state
  if (isPending) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleToggleFollow}
        disabled={isLoading}
        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/50"
      >
        <Clock className="h-3.5 w-3.5 mr-1" />
        {t("profile.pendingFollow")}
      </Button>
    );
  }

  // Following state
  if (isFollowing || isApproved) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleToggleFollow}
        disabled={isLoading}
        className="border-white/20 text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
      >
        <UserMinus className="h-3.5 w-3.5 mr-1" />
        {t("profile.following")}
      </Button>
    );
  }

  // Default: Follow
  return (
    <Button
      variant="default"
      size={size}
      onClick={handleToggleFollow}
      disabled={isLoading}
      className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white"
    >
      <UserPlus className="h-3.5 w-3.5 mr-1" />
      {t("profile.follow")}
    </Button>
  );
}
