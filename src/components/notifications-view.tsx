"use client";

import { useAppStore, Notification } from "@/lib/store";
import { useState, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  MessageCircle,
  Heart,
  Users,
  Image as ImageIcon,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const getNotifIcon = (type: string) => {
  switch (type) {
    case "message": return MessageCircle;
    case "favorite": return Heart;
    case "group": return Users;
    case "photo": return ImageIcon;
    default: return Info;
  }
};

const getNotifColor = (type: string) => {
  switch (type) {
    case "message": return "text-[#0063dc]";
    case "favorite": return "text-[#ff0084]";
    case "group": return "text-green-500";
    case "photo": return "text-orange-500";
    default: return "text-muted-foreground";
  }
};

export function NotificationsView() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAppStore();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      markAllNotificationsRead();
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  }, [markAllNotificationsRead]);

  const handleMarkRead = useCallback(
    async (notif: Notification) => {
      if (notif.isRead) return;
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notif.id }),
        });
        markNotificationRead(notif.id);
      } catch (err) {
        console.error("Failed to mark read:", err);
      }
    },
    [markNotificationRead]
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#ff0084]" />
          Notifiche
          {unreadCount > 0 && (
            <span className="ml-1 text-xs bg-[#ff0084] text-white rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="gap-1.5"
          >
            <CheckCheck className="h-4 w-4" />
            Segna tutto come letto
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Bell className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Nessuna notifica</p>
          <p className="text-sm">Le tue notifiche appariranno qui</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="space-y-2">
            <AnimatePresence>
              {notifications.map((notif, index) => {
                const Icon = getNotifIcon(notif.type);
                const colorClass = getNotifColor(notif.type);
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notif.isRead ? "bg-[#ff0084]/5 border-[#ff0084]/20" : ""
                    }`}
                    onClick={() => handleMarkRead(notif)}
                  >
                    <div className={`mt-0.5 ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.isRead ? "font-semibold" : "font-medium"}`}>
                        {notif.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(notif.createdAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-[#ff0084] shrink-0 mt-2" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
