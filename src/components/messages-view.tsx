"use client";

import { useAppStore, Message } from "@/lib/store";
import { useState, useCallback } from "react";
import {
  Mail,
  Send,
  Plus,
  Trash2,
  MailOpen,
  MailRead,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it, enUS, fr, de as deLocale, es as esLocale, ptBR, ja, ko, zhTW, zhCN } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n";

const dateLocales: Record<string, any> = { it, en: enUS, fr, de: deLocale, es: esLocale, "pt-BR": ptBR, ja, ko, "zh-TW": zhTW, "zh-CN": zhCN };

export function MessagesView() {
  const {
    messages,
    addMessage,
    deleteMessage,
    markMessageRead,
  } = useAppStore();

  const [composeOpen, setComposeOpen] = useState(false);
  const [toUser, setToUser] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const { t, locale } = useI18n();
  const dateLocale = dateLocales[locale] || it;

  const handleSend = useCallback(async () => {
    if (!toUser.trim() || !subject.trim() || !body.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUser, subject, body }),
      });
      if (res.ok) {
        const msg = await res.json();
        addMessage(msg);
        setToUser("");
        setSubject("");
        setBody("");
        setComposeOpen(false);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  }, [toUser, subject, body, addMessage]);

  const handleOpenMessage = useCallback(
    async (msg: Message) => {
      setSelectedMsg(msg);
      if (!msg.isRead) {
        try {
          await fetch(`/api/messages/${msg.id}`, { method: "PATCH" });
          markMessageRead(msg.id);
        } catch (err) {
          console.error("Failed to mark read:", err);
        }
      }
    },
    [markMessageRead]
  );

  const handleDeleteMessage = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
        if (res.ok) {
          deleteMessage(id);
          if (selectedMsg?.id === id) setSelectedMsg(null);
        }
      } catch (err) {
        console.error("Failed to delete message:", err);
      }
    },
    [deleteMessage, selectedMsg]
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Mail className="h-5 w-5 text-[#0063dc]" />
          {t("messages.title")}
        </h2>
        <Button
          size="sm"
          className="bg-[#0063dc] hover:bg-[#0052b5] gap-1.5"
          onClick={() => setComposeOpen(true)}
        >
          <Plus className="h-4 w-4" />
          {t("messages.newMessage")}
        </Button>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Message list */}
        <div className="w-full lg:w-1/3 border rounded-lg overflow-hidden">
          <ScrollArea className="h-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Mail className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">{t("messages.noMessages")}</p>
                <p className="text-sm">{t("messages.noMessagesDesc")}</p>
              </div>
            ) : (
              <div className="divide-y">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !msg.isRead ? "bg-[#0063dc]/5" : ""
                    } ${selectedMsg?.id === msg.id ? "bg-muted" : ""}`}
                    onClick={() => handleOpenMessage(msg)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {!msg.isRead && (
                            <div className="w-2 h-2 rounded-full bg-[#0063dc] shrink-0" />
                          )}
                          <p className={`text-sm truncate ${!msg.isRead ? "font-semibold" : "font-medium"}`}>
                            {msg.subject}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {msg.fromUser === "Admin" ? t("messages.toLabel") : t("messages.from")} {msg.fromUser === "Admin" ? msg.toUser : msg.fromUser}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {msg.body}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {format(new Date(msg.createdAt), "d MMM", { locale: dateLocale })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message detail */}
        <div className="hidden lg:flex flex-1 border rounded-lg overflow-hidden">
          {selectedMsg ? (
            <ScrollArea className="w-full h-full">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedMsg.subject}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{t("messages.from")} {selectedMsg.fromUser}</span>
                      <span>•</span>
                      <span>{t("messages.toLabel")} {selectedMsg.toUser}</span>
                      <span>•</span>
                      <span>{format(new Date(selectedMsg.createdAt), "d MMMM yyyy '" + t("comments.at") + "' HH:mm", { locale: dateLocale })}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive shrink-0"
                    onClick={() => handleDeleteMessage(selectedMsg.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Separator />
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedMsg.body}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center w-full text-muted-foreground">
              <MailOpen className="h-16 w-16 mb-4 opacity-30" />
              <p>{t("messages.selectMessage")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("messages.composeTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t("messages.to")}
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
            />
            <Input
              placeholder={t("messages.subject")}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <Textarea
              placeholder={t("messages.body")}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
            />
            <Button
              onClick={handleSend}
              disabled={!toUser.trim() || !subject.trim() || !body.trim() || isSending}
              className="w-full bg-[#0063dc] hover:bg-[#0052b5]"
            >
              {isSending ? (
                t("messages.sending")
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t("messages.sendButton")}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
