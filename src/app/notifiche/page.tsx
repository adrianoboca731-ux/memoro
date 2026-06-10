"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import {
  Bell,
  CheckCheck,
  MessageCircle,
  Heart,
  Users,
  Image as ImageIcon,
  Info,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";

const getNotifIcon = (type: string) => {
  switch (type) {
    case "message": return Mail;
    case "favorite": return Heart;
    case "comment": return MessageCircle;
    case "follow": return Users;
    case "group_invite": return Users;
    case "group": return Users;
    case "photo": return ImageIcon;
    default: return Info;
  }
};

const getNotifColor = (type: string) => {
  switch (type) {
    case "message": return "text-[#0063dc]";
    case "favorite": return "text-[#ff0084]";
    case "comment": return "text-green-500";
    case "follow": return "text-purple-500";
    case "group_invite": return "text-orange-500";
    case "group": return "text-orange-500";
    case "photo": return "text-yellow-500";
    default: return "text-white/40";
  }
};

const getNotifLink = (notif: any) => {
  if (notif.link) return notif.link;
  switch (notif.type) {
    case "favorite":
    case "comment":
    case "photo":
      return "/esplora";
    case "follow":
      return `/persone/${notif.fromUser?.username || ""}`;
    case "group_invite":
    case "group":
      return "/gruppi";
    case "message":
      return "/messaggi";
    default:
      return "#";
  }
};

export default function NotifichePage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || data);
      }
    } catch (err) {
      console.error("Errore:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Errore:", err);
    }
  }, []);

  const handleMarkRead = useCallback(async (notif: any) => {
    if (notif.isRead) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif.id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Errore:", err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Bell className="h-8 w-8 text-[#ff0084]" />
                  Notifiche
                  {unreadCount > 0 && (
                    <span className="text-xs bg-[#ff0084] text-white rounded-full px-2 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </h1>
                <p className="text-white/40 mt-1">Resta aggiornato sulle attività</p>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="gap-1.5 border-white/10 text-white/70 hover:bg-white/5"
                >
                  <CheckCheck className="h-4 w-4" />
                  Segna tutte come lette
                </Button>
              )}
            </div>
          </motion.div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="bg-white/5 border-white/10 animate-pulse">
                  <CardContent className="p-4 flex gap-3">
                    <div className="w-5 h-5 bg-white/5 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/5 rounded w-3/4" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Nessuna notifica"
              description="Le tue notifiche appariranno qui"
            />
          ) : (
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-2">
                <AnimatePresence>
                  {notifications.map((notif, index) => {
                    const Icon = getNotifIcon(notif.type);
                    const colorClass = getNotifColor(notif.type);
                    const link = getNotifLink(notif);
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                      >
                        <Link href={link}>
                          <Card
                            className={`cursor-pointer transition-colors hover:bg-white/5 border-white/5 ${
                              !notif.isRead ? "bg-[#ff0084]/5 border-[#ff0084]/10" : "bg-white/[0.02]"
                            }`}
                            onClick={() => handleMarkRead(notif)}
                          >
                            <CardContent className="p-4 flex items-start gap-3">
                              <div className={`mt-0.5 shrink-0 ${colorClass}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notif.isRead ? "font-semibold text-white" : "text-white/70"}`}>
                                  {notif.title}
                                </p>
                                <p className="text-sm text-white/40 mt-0.5">{notif.message}</p>
                                <p className="text-[10px] text-white/20 mt-1">
                                  {format(new Date(notif.createdAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                                </p>
                              </div>
                              {!notif.isRead && (
                                <div className="w-2 h-2 rounded-full bg-[#ff0084] shrink-0 mt-2" />
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </div>
      </main>

      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-white/20 mt-8">
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">Memoro</span>
        <span className="ml-1">&mdash; Condividi i Tuoi Ricordi</span>
      </footer>
    </div>
  );
}
