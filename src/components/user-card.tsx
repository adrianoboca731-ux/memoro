"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { FollowButton } from "./follow-button";

interface UserCardProps {
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    bio?: string | null;
    photoCount?: number;
    followerCount?: number;
  };
  showFollow?: boolean;
}

export function UserCard({ user, showFollow = true }: UserCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:shadow-md transition-shadow">
      <Link href={`/persone/${user.username}`} className="shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar || undefined} alt={user.name} />
          <AvatarFallback className="bg-[#0063dc] text-white text-lg">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/persone/${user.username}`} className="font-medium text-sm hover:underline truncate block">
          {user.name}
        </Link>
        <p className="text-xs text-muted-foreground">@{user.username}</p>
        {(user.photoCount !== undefined || user.followerCount !== undefined) && (
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {user.photoCount !== undefined && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {user.photoCount} foto
              </span>
            )}
            {user.followerCount !== undefined && (
              <span>{user.followerCount} follower</span>
            )}
          </div>
        )}
      </div>
      {showFollow && (
        <FollowButton userId={user.id} username={user.username} />
      )}
    </div>
  );
}
