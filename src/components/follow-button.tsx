"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";

interface FollowButtonProps {
  userId: string;
  username: string;
  initialFollowing?: boolean;
  size?: "sm" | "default";
}

export function FollowButton({ userId, username, initialFollowing = false, size = "sm" }: FollowButtonProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const currentUserId = (session?.user as any)?.id;
  const isOwnProfile = currentUserId === userId;

  const handleToggleFollow = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading || !session) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (err) {
      console.error("Errore nel seguire l'utente:", err);
    } finally {
      setIsLoading(false);
    }
  }, [username, isFollowing, isLoading, session]);

  if (!session || isOwnProfile) return null;

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size={size}
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={
        isFollowing
          ? "border-white/20 text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          : "bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white"
      }
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-3.5 w-3.5 mr-1" />
          Seguendo
        </>
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          Segui
        </>
      )}
    </Button>
  );
}
