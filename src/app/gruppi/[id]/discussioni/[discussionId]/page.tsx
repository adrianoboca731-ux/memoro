"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  User,
  Reply,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { it, enUS, fr, de as deLocale, es as esLocale, ptBR, ja, ko, zhTW, zhCN } from "date-fns/locale";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const dateLocales: Record<string, any> = { it, en: enUS, fr, de: deLocale, es: esLocale, "pt-BR": ptBR, ja, ko, "zh-TW": zhTW, "zh-CN": zhCN };

export default function DiscussionePage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const groupId = params.id as string;
  const discussionId = params.discussionId as string;

  const [discussion, setDiscussion] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateLocale = dateLocales[locale] || it;

  const fetchDiscussion = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/discussions`);
      if (res.ok) {
        const data = await res.json();
        const disc = Array.isArray(data)
          ? data.find((d: any) => d.id === discussionId)
          : null;
        if (disc) setDiscussion(disc);
      }
    } catch (err) {
      console.error("Error loading:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId, discussionId]);

  useEffect(() => {
    fetchDiscussion();
  }, [fetchDiscussion]);

  const handleReply = useCallback(async () => {
    if (!replyText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discussionId,
          body: replyText,
          reply: true,
        }),
      });
      if (res.ok) {
        const reply = await res.json();
        setReplies((prev) => [...prev, reply]);
        setReplyText("");
      }
    } catch (err) {
      console.error("Error sending:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [groupId, discussionId, replyText, isSubmitting]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-64 bg-white/5" />
          <Skeleton className="h-4 w-32 bg-white/5" />
          <Skeleton className="h-40 w-full bg-white/5" />
        </div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <EmptyState icon={MessageSquare} title={t("discussion.notFound")} description={t("discussion.notFoundDesc")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Back */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/gruppi/${groupId}`)}
            className="text-white/50 hover:text-white hover:bg-white/5 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("discussion.backToGroup")}
          </Button>

          {/* Discussion header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-white">{discussion.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-[#0063dc] text-white text-[8px]">
                    {discussion.author?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span>{discussion.author?.name || t("common.user")}</span>
              </div>
              <span>&bull;</span>
              <span>{format(new Date(discussion.createdAt), "d MMMM yyyy '" + t("comments.at") + "' HH:mm", { locale: dateLocale })}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1"><Reply className="h-3 w-3" /> {discussion.replyCount || replies.length} {t("groups.replies")}</span>
            </div>
          </motion.div>

          <Separator className="bg-white/5" />

          {/* Original post */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-5">
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{discussion.body}</p>
            </CardContent>
          </Card>

          <Separator className="bg-white/5" />

          {/* Replies */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/50">
              {t("discussion.replies")} ({replies.length})
            </h3>

            {replies.length === 0 && (
              <p className="text-sm text-white/30 text-center py-4">
                {t("discussion.noReplies")}
              </p>
            )}

            {replies.map((reply: any, index: number) => (
              <motion.div
                key={reply.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white/[0.03] border-white/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={reply.author?.avatar || undefined} />
                        <AvatarFallback className="bg-[#0063dc]/30 text-[#0063dc] text-xs">
                          {reply.author?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white/80">
                            {reply.author?.name || t("common.user")}
                          </span>
                          <span className="text-[10px] text-white/30">
                            {format(new Date(reply.createdAt), "d MMM yyyy '" + t("comments.at") + "' HH:mm", { locale: dateLocale })}
                          </span>
                        </div>
                        <p className="text-sm text-white/60 mt-1 whitespace-pre-wrap">{reply.body}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Reply form */}
          {session?.user && (
            <div className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-sm font-medium text-white/60">{t("discussion.reply")}</h3>
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={(session.user as any).image || undefined} />
                  <AvatarFallback className="bg-[#0063dc] text-white text-xs">
                    {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder={t("discussion.replyPlaceholder")}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none text-sm"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleReply}
                      disabled={!replyText.trim() || isSubmitting}
                      className="bg-[#0063dc] hover:bg-[#0052b5] text-white gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {isSubmitting ? t("common.sending") : t("discussion.reply")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!session?.user && (
            <p className="text-sm text-white/30 text-center py-4">
              <a href="/auth/accedi" className="text-[#0063dc] hover:underline">{t("auth.loginButton")}</a> {t("discussion.loginToReply")}
            </p>
          )}
        </div>
      </main>

      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-white/20 mt-8">
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">Memoro</span>
        <span className="ml-1">&mdash; {t("home.footerShort")}</span>
      </footer>
    </div>
  );
}
