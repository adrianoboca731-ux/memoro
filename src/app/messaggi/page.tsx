"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import {
  Mail,
  Send,
  Plus,
  Trash2,
  MailOpen,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function MessaggiPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [toUser, setToUser] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Errore:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

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
        setMessages((prev) => [msg, ...prev]);
        setToUser("");
        setSubject("");
        setBody("");
        setComposeOpen(false);
      }
    } catch (err) {
      console.error("Errore:", err);
    } finally {
      setIsSending(false);
    }
  }, [toUser, subject, body]);

  const handleOpenMessage = useCallback(async (msg: any) => {
    setSelectedMsg(msg);
    if (!msg.isRead) {
      try {
        await fetch(`/api/messages/${msg.id}`, { method: "PATCH" });
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
        );
      } catch (err) {
        console.error("Errore:", err);
      }
    }
  }, []);

  const handleDeleteMessage = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (selectedMsg?.id === id) setSelectedMsg(null);
      }
    } catch (err) {
      console.error("Errore:", err);
    }
  }, [selectedMsg]);

  const unreadCount = messages.filter((m) => !m.isRead).length;

  // Group messages by conversation (other user)
  const conversations = messages.reduce((acc: Record<string, any[]>, msg) => {
    const otherUser = msg.fromId === (session?.user as any)?.id
      ? msg.toId
      : msg.fromId;
    if (!acc[otherUser]) acc[otherUser] = [];
    acc[otherUser].push(msg);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Mail className="h-8 w-8 text-[#0063dc]" />
                  Messaggi
                  {unreadCount > 0 && (
                    <span className="text-xs bg-[#0063dc] text-white rounded-full px-2 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </h1>
                <p className="text-white/40 mt-1">Le tue conversazioni private</p>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white gap-1.5"
                onClick={() => setComposeOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Nuovo messaggio
              </Button>
            </div>
          </motion.div>

          <div className="flex gap-4 h-[calc(100vh-220px)]">
            {/* Message list */}
            <div className="w-full lg:w-1/3 border border-white/10 rounded-lg overflow-hidden bg-white/[0.02]">
              <ScrollArea className="h-full">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-10 h-10 bg-white/5 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-white/5 rounded w-3/4" />
                          <div className="h-3 bg-white/5 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <EmptyState
                    icon={Mail}
                    title="Nessun messaggio"
                    description="Invia un messaggio per iniziare una conversazione"
                  />
                ) : (
                  <div className="divide-y divide-white/5">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-3 cursor-pointer hover:bg-white/5 transition-colors ${
                          !msg.isRead ? "bg-[#0063dc]/5" : ""
                        } ${selectedMsg?.id === msg.id ? "bg-white/10" : ""}`}
                        onClick={() => handleOpenMessage(msg)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-[#0063dc] text-white text-xs">
                              {msg.sender?.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm truncate ${!msg.isRead ? "font-semibold text-white" : "text-white/70"}`}>
                                {msg.subject}
                              </p>
                              {!msg.isRead && (
                                <div className="w-2 h-2 rounded-full bg-[#0063dc] shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-white/40 mt-0.5">
                              {msg.sender?.name || "Utente"}
                            </p>
                            <p className="text-xs text-white/30 mt-0.5 truncate">{msg.body}</p>
                            <p className="text-[10px] text-white/20 mt-1">
                              {format(new Date(msg.createdAt), "d MMM yyyy", { locale: it })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Message detail */}
            <div className="hidden lg:flex flex-1 border border-white/10 rounded-lg overflow-hidden bg-white/[0.02]">
              {selectedMsg ? (
                <ScrollArea className="w-full h-full">
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{selectedMsg.subject}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-white/40">
                          <User className="h-4 w-4" />
                          <span>Da: {selectedMsg.sender?.name || "Utente"}</span>
                          <span>&bull;</span>
                          <span>
                            {format(new Date(selectedMsg.createdAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:bg-red-500/10 shrink-0"
                        onClick={() => handleDeleteMessage(selectedMsg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="whitespace-pre-wrap text-sm text-white/60 leading-relaxed">
                      {selectedMsg.body}
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center w-full text-white/30">
                  <MailOpen className="h-16 w-16 mb-4 opacity-30" />
                  <p>Seleziona un messaggio per leggerlo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="bg-[#2a2a2d] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Nuovo Messaggio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="A (nome utente)"
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
            <Input
              placeholder="Oggetto"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
            <Textarea
              placeholder="Scrivi il tuo messaggio..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!toUser.trim() || !subject.trim() || !body.trim() || isSending}
              className="w-full bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white"
            >
              {isSending ? "Invio..." : (
                <><Send className="h-4 w-4 mr-2" /> Invia Messaggio</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-white/20 mt-8">
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">Memoro</span>
        <span className="ml-1">&mdash; Condividi i Tuoi Ricordi</span>
      </footer>
    </div>
  );
}
