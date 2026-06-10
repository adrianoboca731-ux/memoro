"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/header";
import { PhotoCard } from "@/components/photo-card";
import { EmptyState } from "@/components/empty-state";
import { Heart, Camera } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function PreferitiPage() {
  const { data: session } = useSession();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/photos?favorites=true&limit=50");
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || data);
      }
    } catch (err) {
      console.error("Errore:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) fetchFavorites();
  }, [session, fetchFavorites]);

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <EmptyState
          icon={Heart}
          title="Accedi per vedere i preferiti"
          description="Effettua l'accesso per visualizzare le tue foto preferite"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Heart className="h-8 w-8 text-[#ff0084]" />
              I tuoi preferiti
            </h1>
            <p className="text-white/40 mt-1">Le foto che hai aggiunto ai preferiti</p>
          </motion.div>

          {loading ? (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="break-inside-avoid">
                  <Skeleton
                    className="w-full rounded-lg bg-white/5"
                    style={{ height: `${150 + Math.random() * 200}px` }}
                  />
                </div>
              ))}
            </div>
          ) : photos.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Nessun preferito"
              description="Esplora le foto e aggiungile ai preferiti cliccando il cuore"
              actionLabel="Esplora foto"
              onAction={() => window.location.href = "/esplora"}
            />
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  className="break-inside-avoid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.5) }}
                >
                  <PhotoCard photo={photo} />
                </motion.div>
              ))}
            </div>
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
