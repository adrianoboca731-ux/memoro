"use client";

import { useAppStore } from "@/lib/store";
import { useState, useCallback } from "react";
import { LayoutGrid, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { PhotoGrid } from "./photo-grid";

export function GalleriesView() {
  const { galleries, selectedGalleryId, selectGallery, photos, addGallery, deleteGallery } = useAppStore();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/galleries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName, description: newDesc }) });
      if (res.ok) { const g = await res.json(); addGallery(g); setNewName(""); setNewDesc(""); setCreateOpen(false); }
    } catch {} finally { setIsCreating(false); }
  }, [newName, newDesc, addGallery]);

  const handleDelete = useCallback(async (id: string) => {
    try { const res = await fetch(`/api/galleries/${id}`, { method: "DELETE" }); if (res.ok) deleteGallery(id); } catch {}
  }, [deleteGallery]);

  if (selectedGalleryId) {
    const gallery = galleries.find((g) => g.id === selectedGalleryId);
    return (
      <div className="p-4">
        <Button variant="ghost" size="sm" onClick={() => selectGallery(null)} className="text-white/50 hover:text-white mb-2">← Tutte le Gallerie</Button>
        <h2 className="text-xl font-bold text-white">{gallery?.name}</h2>
        {gallery?.description && <p className="text-sm text-white/40 mt-0.5">{gallery.description}</p>}
        <PhotoGrid photos={photos.slice(0, 10)} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-[#ff0084]" /> Gallerie</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <Button size="sm" className="bg-[#ff0084] hover:bg-[#d6006f] gap-1.5" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Nuova Galleria</Button>
          <DialogContent className="bg-[#2a2a2d] border-white/10">
            <DialogHeader><DialogTitle className="text-white">Crea Nuova Galleria</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Nome della galleria" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              <Textarea placeholder="Descrizione (opzionale)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              <Button onClick={handleCreate} disabled={!newName.trim() || isCreating} className="w-full bg-[#ff0084] hover:bg-[#d6006f]">{isCreating ? "Creazione..." : "Crea Galleria"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-sm text-white/30">Le gallerie sono collezioni curate delle tue foto preferite.</p>
      {galleries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30"><LayoutGrid className="h-16 w-16 mb-4" /><p className="text-lg font-medium">Nessuna galleria</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {galleries.map((gallery, index) => (
              <motion.div key={gallery.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow bg-white/5 border-white/10" onClick={() => selectGallery(gallery.id)}>
                  <CardContent className="p-0">
                    <div className="aspect-square relative bg-white/5 overflow-hidden">
                      {gallery.cover ? <img src={gallery.cover} alt={gallery.name} className="w-full h-full object-cover" /> : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff0084]/20 to-[#0063dc]/20"><LayoutGrid className="h-12 w-12 text-white/10" /></div>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDelete(gallery.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="p-3"><h3 className="font-medium text-sm truncate text-white/80">{gallery.name}</h3><p className="text-xs text-white/40 mt-0.5">{gallery.itemCount ?? 0} foto</p></div>
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
