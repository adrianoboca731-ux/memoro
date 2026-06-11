"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { PhotoCard } from "@/components/photo-card";
import { UserCard } from "@/components/user-card";
import { EmptyState } from "@/components/empty-state";
import {
  Search as SearchIcon,
  Image as ImageIcon,
  Users,
  Camera,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";


export default function CercaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0d0d]"><Header /><div className="flex items-center justify-center h-[calc(100vh-56px)]"><Skeleton className="w-[600px] h-[400px] rounded-lg bg-white/5" /></div></div>}>
      <CercaContent />
    </Suspense>
  );
}

function CercaContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [photoResults, setPhotoResults] = useState<any[]>([]);
  const [peopleResults, setPeopleResults] = useState<any[]>([]);
  const [groupResults, setGroupResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setPhotoResults(data.photos || []);
        setPeopleResults(data.users || []);
        setGroupResults(data.groups || []);
      }
    } catch (err) {
      console.error("Error searching:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  }, [initialQuery, doSearch]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setActiveQuery(query);
      doSearch(query);
    },
    [query, doSearch]
  );

  const totalResults = photoResults.length + peopleResults.length + groupResults.length;

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Search bar */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-4">
              <SearchIcon className="h-8 w-8 text-[#ff0084]" />
              {t("search.title")}
            </h1>
            <form onSubmit={handleSearch} className="relative max-w-2xl">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="pl-12 h-12 text-base bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
              />
            </form>
            {activeQuery && (
              <p className="text-sm text-white/40 mt-2">
                {totalResults} {t("search.resultsFor")} &quot;{activeQuery}&quot;
              </p>
            )}
          </motion.div>

          {loading && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20 bg-white/5" />
                <Skeleton className="h-9 w-20 bg-white/5" />
                <Skeleton className="h-9 w-20 bg-white/5" />
              </div>
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="rounded-lg bg-white/5" style={{ height: `${150 + Math.random() * 150}px` }} />
                ))}
              </div>
            </div>
          )}

          {!loading && activeQuery && (
            <Tabs defaultValue="photos">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="photos" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 gap-1">
                  <ImageIcon className="h-4 w-4" /> {t("search.photos")} ({photoResults.length})
                </TabsTrigger>
                <TabsTrigger value="people" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 gap-1">
                  <Users className="h-4 w-4" /> {t("search.people")} ({peopleResults.length})
                </TabsTrigger>
                <TabsTrigger value="groups" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 gap-1">
                  <Camera className="h-4 w-4" /> {t("search.groups")} ({groupResults.length})
                </TabsTrigger>
              </TabsList>

              {/* Photos results */}
              <TabsContent value="photos" className="mt-4">
                {photoResults.length === 0 ? (
                  <EmptyState icon={Camera} title={t("search.noPhotos")} description={t("search.noPhotosDesc")} />
                ) : (
                  <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                    {photoResults.map((photo, index) => (
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
              </TabsContent>

              {/* People results */}
              <TabsContent value="people" className="mt-4">
                {peopleResults.length === 0 ? (
                  <EmptyState icon={Users} title={t("search.noPeople")} description={t("search.noPeopleDesc")} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {peopleResults.map((user: any) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Groups results */}
              <TabsContent value="groups" className="mt-4">
                {groupResults.length === 0 ? (
                  <EmptyState icon={Camera} title={t("search.noGroups")} description={t("search.noGroupsDesc")} />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {groupResults.map((group: any) => (
                      <Link key={group.id} href={`/gruppi/${group.id}`}>
                        <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow bg-white/5 border-white/10">
                          <CardContent className="p-0">
                            <div className="aspect-video relative bg-white/5 overflow-hidden">
                              {group.cover ? (
                                <img src={group.cover} alt={group.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0063dc]/20 to-[#ff0084]/20">
                                  <Users className="h-8 w-8 text-white/10" />
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="font-medium text-sm truncate text-white/80">{group.name}</h3>
                              <div className="flex items-center gap-2 mt-1 text-xs text-white/30">
                                <span>{group.memberCount || 0} {t("common.members")}</span>
                                <span>{group.photoCount || 0} {t("common.photos")}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {!loading && !activeQuery && (
            <EmptyState
              icon={SearchIcon}
              title={t("search.searchOnMemoro")}
              description={t("search.searchMemoroDesc")}
            />
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
