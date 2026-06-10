"use client";

import { useAppStore, Group } from "@/lib/store";
import { useState, useCallback } from "react";
import {
  Users,
  Plus,
  Trash2,
  Image as ImageIcon,
  ChevronRight,
  Globe,
  Lock,
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
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { PhotoGrid } from "./photo-grid";

export function GroupsView() {
  const {
    groups,
    selectedGroupId,
    selectGroup,
    photos,
    addGroup,
    deleteGroup,
  } = useAppStore();

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupRules, setNewGroupRules] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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
        addGroup(group);
        setNewGroupName("");
        setNewGroupDesc("");
        setNewGroupRules("");
        setCreateOpen(false);
      }
    } catch (err) {
      console.error("Failed to create group:", err);
    } finally {
      setIsCreating(false);
    }
  }, [newGroupName, newGroupDesc, newGroupRules, addGroup]);

  const handleDeleteGroup = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
        if (res.ok) deleteGroup(id);
      } catch (err) {
        console.error("Failed to delete group:", err);
      }
    },
    [deleteGroup]
  );

  // If a group is selected, show its photos
  if (selectedGroupId) {
    const group = groups.find((g) => g.id === selectedGroupId);
    const groupPhotos = group?.photos?.map((gp) => gp.photo) || photos.filter((p) => p.albumId === null).slice(0, 8);

    return (
      <div>
        <div className="flex items-center justify-between p-4 pb-0">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectGroup(null)}
              className="text-muted-foreground mb-1 -ml-2"
            >
              ← Tutti i Gruppi
            </Button>
            <h2 className="text-xl font-bold">{group?.name || "Gruppo"}</h2>
            {group?.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {group.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> {group?.memberCount || 1} membri
            </span>
            <span className="flex items-center gap-1">
              <ImageIcon className="h-4 w-4" /> {group?.photoCount || 0} foto
            </span>
          </div>
        </div>
        {group?.rules && (
          <div className="mx-4 mt-3 p-3 bg-muted/50 rounded-lg text-sm">
            <p className="font-medium mb-1">Regole del gruppo</p>
            <p className="text-muted-foreground">{group.rules}</p>
          </div>
        )}
        <PhotoGrid photos={groupPhotos} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-[#0063dc]" />
          Gruppi
        </h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <Button size="sm" className="bg-[#0063dc] hover:bg-[#0052b5] gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuovo Gruppo
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuovo Gruppo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Nome del gruppo"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <Textarea
                placeholder="Descrizione (opzionale)"
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                rows={3}
              />
              <Textarea
                placeholder="Regole del gruppo (opzionale)"
                value={newGroupRules}
                onChange={(e) => setNewGroupRules(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || isCreating}
                className="w-full bg-[#0063dc] hover:bg-[#0052b5]"
              >
                {isCreating ? "Creazione..." : "Crea Gruppo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Users className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Nessun gruppo ancora</p>
          <p className="text-sm">Crea un gruppo per condividere foto con la community</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
                  onClick={() => selectGroup(group.id)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-video relative bg-muted overflow-hidden">
                      {group.cover ? (
                        <img
                          src={group.cover}
                          alt={group.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0063dc]/20 to-[#ff0084]/20">
                          <Users className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        {group.isPublic ? (
                          <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-white/90">
                            <Globe className="h-2.5 w-2.5" /> Pubblico
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-white/90">
                            <Lock className="h-2.5 w-2.5" /> Privato
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate">{group.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {group.memberCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" /> {group.photoCount}
                        </span>
                      </div>
                    </div>
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
