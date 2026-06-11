"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageCircle, User } from "lucide-react";
import { format } from "date-fns";
import { it, enUS, fr, de as deLocale, es as esLocale, ptBR, ja, ko, zhTW, zhCN } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";

const dateLocales: Record<string, any> = { it, en: enUS, fr, de: deLocale, es: esLocale, "pt-BR": ptBR, ja, ko, "zh-TW": zhTW, "zh-CN": zhCN };

interface Comment {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  } | null;
}

interface CommentSectionProps {
  photoId: string;
  comments: Comment[];
  onCommentAdded?: (comment: Comment) => void;
}

export function CommentSection({ photoId, comments, onCommentAdded }: CommentSectionProps) {
  const { data: session } = useSession();
  const { t, locale } = useI18n();
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  const dateLocale = dateLocales[locale] || it;

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/photos/${photoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText }),
      });
      if (res.ok) {
        const comment = await res.json();
        setLocalComments((prev) => [comment, ...prev]);
        setCommentText("");
        onCommentAdded?.(comment);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }, [photoId, commentText, isSubmitting, onCommentAdded]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground/70">
        <MessageCircle className="h-4 w-4" />
        <span>{t("comments.title")} ({localComments.length})</span>
      </div>

      {/* Add comment form */}
      {session?.user && (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={(session.user as any).image || undefined} />
            <AvatarFallback className="bg-[#0063dc] text-white text-xs">
              {session.user.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder={t("comments.addComment")}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              className="bg-white/5 border-white/10 text-foreground resize-none text-sm"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!commentText.trim() || isSubmitting}
                className="bg-[#0063dc] hover:bg-[#0052b5] text-white gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? t("common.sending") : t("comments.submit")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!session?.user && (
        <p className="text-sm text-muted-foreground text-center py-2">
          <a href="/auth/accedi" className="text-[#0063dc] hover:underline">{t("nav.login")}</a> {t("comments.loginToComment")}
        </p>
      )}

      {/* Comments list */}
      <AnimatePresence>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {localComments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.author?.avatar || undefined} />
                <AvatarFallback className="bg-[#0063dc]/30 text-[#0063dc] text-xs">
                  {comment.author?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground/90">
                    {comment.author?.name || t("common.user")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(comment.createdAt), "d MMM yyyy '" + t("comments.at") + "' HH:mm", { locale: dateLocale })}
                  </span>
                </div>
                <p className="text-sm text-foreground/70 mt-0.5">{comment.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {localComments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t("comments.noComments")}
        </p>
      )}
    </div>
  );
}
