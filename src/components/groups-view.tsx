"use client";

import { useAppStore } from "@/lib/store";
import { useState, useCallback } from "react";
import { Users, Plus, Trash2, Image as ImageIcon, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { PhotoGrid } from "./photo-grid";
import { useI18n } from "@/lib/i18n";

export function GroupsView() {
  const { groups, selectedGroupId, selectGroup, photos, addGroup, deleteGroup } = useAppStore();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupRules, setNewGroupRules] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { t } = useI18n();

  const handleCreateGroup = useCallback(async () => {
    if (!newGroupName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName, description: newGroupDesc, rules: newGroupRules }),
      });
      if (res.ok) { const group = await res.json(); addGroup(group); setNewGroupName(""); setNewGroupDesc(""); setNewGroupRules(""); setCreateOpen(false); }
    } catch {} finally { setIsCreating(false); }
  }, [newGroupName, newGroupDesc, newGroupRules, addGroup]);

  const handleDeleteGroup = useCallback(async (id: string) => {
    try { const res = await fetch(`/api/groups/${id}`, { method: "DELETE" }); if (res.ok) deleteGroup(id); } catch {}
  }, [deleteGroup]);

  if (selectedGroupId) {
    const group = groups.find((g) => g.id === selectedGroupId);
    const groupPhotos = photos.slice(0, 12);
    return (
      <div className="p-4">
        <Button variant="ghost" size="sm" onClick={() => selectGroup(null)} className="text-white/50 hover:text-white mb-2">← {t("groups.allGroupsNav")}</Button>
        <h2 className="text-xl font-bold text-white">{group?.name}</h2>
        {group?.description && <p className="text-sm text-white/40 mt-0.5">{group.description}</p>}
        {group?.rules && <div className="mt-3 p-3 bg-white/5 rounded-lg text-sm"><p className="font-medium text-white/60 mb-1">{t("groups.groupRulesTitle")}</p><p className="text-white/40">{group.rules}</p></div>}
        <div className="flex items-center gap-3 mt-3 text-sm text-white/40">
          <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {group?.memberCount || 1} {t("common.members")}</span>
          <span className="flex items-center gap-1"><ImageIcon className="h-4 w-4" /> {group?.photoCount || 0} {t("common.photos")}</span>
        </div>
        <PhotoGrid photos={groupPhotos} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Users className="h-5 w-5 text-[#0063dc]" /> {t("groups.title")}</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <Button size="sm" className="bg-[#0063dc] hover:bg-[#0052b5] gap-1.5" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> {t("groups.createGroup")}</Button>
          <DialogContent className="bg-[#2a2a2d] border-white/10">
            <DialogHeader><DialogTitle className="text-white">{t("groups.createTitle")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder={t("groups.groupName")} value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              <Textarea placeholder={t("groups.groupDesc")} value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} rows={3} className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              <Textarea placeholder={t("groups.groupRules")} value={newGroupRules} onChange={(e) => setNewGroupRules(e.target.value)} rows={3} className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || isCreating} className="w-full bg-[#0063dc] hover:bg-[#0052b5]">{isCreating ? t("common.creating") : t("groups.createButton")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30"><Users className="h-16 w-16 mb-4" /><p className="text-lg font-medium">{t("groups.noGroups")}</p><p className="text-sm">{t("groups.noGroupsCreateAlt")}</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {groups.map((group, index) => (
              <motion.div key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow bg-white/5 border-white/10" onClick={() => selectGroup(group.id)}>
                  <CardContent className="p-0">
                    <div className="aspect-video relative bg-white/5 overflow-hidden">
                      {group.cover ? <img src={group.cover} alt={group.name} className="w-full h-full object-cover" /> : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0063dc]/20 to-[#ff0084]/20"><Users className="h-12 w-12 text-white/10" /></div>
                      )}
                      <div className="absolute top-2 left-2">{group.isPublic ? <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-black/50 text-white/80 border-0"><Globe className="h-2.5 w-2.5" /> {t("groups.public")}</Badge> : <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-black/50 text-white/80 border-0"><Lock className="h-2.5 w-2.5" /> {t("groups.private")}</Badge>}</div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="p-3"><h3 className="font-medium text-sm truncate text-white/80">{group.name}</h3><div className="flex items-center gap-2 mt-1 text-xs text-white/40"><span className="flex items-center gap-1"><Users className="h-3 w-3" /> {group.memberCount}</span><span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> {group.photoCount}</span></div></div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
