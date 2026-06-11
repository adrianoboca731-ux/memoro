"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import {
  Users,
  Plus,
  Globe,
  Lock,
  Search,
  Image as ImageIcon,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function GruppiPage() {
  const { t } = useI18n();
  const [groups, setGroups] = useState<any[]>([]);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupRules, setNewGroupRules] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("my");

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        const groupList = Array.isArray(data) ? data : [];
        setGroups(groupList);
        setAllGroups(groupList);
      }
    } catch (err) {
      console.error("Errore nel caricamento:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateGroup = useCallback(async () => {
    if (!newGroupName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc,
          rules: newGroupRules,
        }),
      });
      if (res.ok) {
        const group = await res.json();
        setGroups((prev) => [group, ...prev]);
        setNewGroupName("");
        setNewGroupDesc("");
        setNewGroupRules("");
        setCreateOpen(false);
      }
    } catch (err) {
      console.error("Errore nella creazione:", err);
    } finally {
      setIsCreating(false);
    }
  }, [newGroupName, newGroupDesc, newGroupRules]);

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Users className="h-8 w-8 text-[#0063dc]" />
                  {t("groups.title")}
                </h1>
                <p className="text-white/40 mt-1">{t("groups.subtitle")}</p>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white gap-1.5"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t("groups.createGroup")}
              </Button>
            </div>
          </motion.div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              placeholder={t("groups.searchGroups")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="my" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">
                {t("groups.myGroups")}
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">
                {t("groups.allGroups")}
              </TabsTrigger>
              <TabsTrigger value="trending" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">
                {t("groups.trending")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my" className="mt-4">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-lg bg-white/5" />
                  ))}
                </div>
              ) : filteredGroups.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={t("groups.noGroups")}
                  description={t("groups.noGroupsDesc")}
                  actionLabel={t("groups.createGroup")}
                  onAction={() => setCreateOpen(true)}
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  <AnimatePresence>
                    {filteredGroups.map((group, index) => (
                      <GroupCard key={group.id} group={group} index={index} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-lg bg-white/5" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  <AnimatePresence>
                    {filteredGroups.map((group, index) => (
                      <GroupCard key={group.id} group={group} index={index} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            <TabsContent value="trending" className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence>
                  {filteredGroups
                    .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
                    .map((group, index) => (
                      <GroupCard key={group.id} group={group} index={index} />
                    ))}
                </AnimatePresence>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Create Group Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#2a2a2d] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{t("groups.createTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t("groups.groupName")}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
            <Textarea
              placeholder={t("groups.groupDesc")}
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
            />
            <Textarea
              placeholder={t("groups.groupRules")}
              value={newGroupRules}
              onChange={(e) => setNewGroupRules(e.target.value)}
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
            />
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || isCreating}
              className="w-full bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white"
            >
              {isCreating ? t("common.creating") : t("groups.createButton")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-white/20 mt-8">
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">Memoro</span>
        <span className="ml-1">&mdash; {t("home.footerShort")}</span>
      </footer>
    </div>
  );
}

function GroupCard({ group, index }: { group: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/gruppi/${group.id}`}>
        <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow bg-white/5 border-white/10">
          <CardContent className="p-0">
            <div className="aspect-video relative bg-white/5 overflow-hidden">
              {group.cover ? (
                <img
                  src={group.cover}
                  alt={group.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0063dc]/20 to-[#ff0084]/20">
                  <Users className="h-12 w-12 text-white/10" />
                </div>
              )}
              <div className="absolute top-2 left-2">
                {group.isPublic ? (
                  <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-black/50 text-white/80 border-0">
                    <Globe className="h-2.5 w-2.5" /> {t("groups.public")}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-black/50 text-white/80 border-0">
                    <Lock className="h-2.5 w-2.5" /> {t("groups.private")}
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm truncate text-white/80">{group.name}</h3>
              {group.description && (
                <p className="text-xs text-white/30 mt-0.5 line-clamp-2">{group.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {group.memberCount || 1}
                </span>
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" /> {group.photoCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> {group.discussionCount || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
