"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/header";
import { PhotoCard } from "@/components/photo-card";
import { FollowButton } from "@/components/follow-button";
import { EmptyState } from "@/components/empty-state";
import {
  Camera,
  Image as ImageIcon,
  Heart,
  Users,
  LayoutGrid,
  FolderOpen,
  MapPin,
  Globe,
  Mail,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function ProfiloPage() {
  const { t } = useI18n();
  const params = useParams();
  const { data: session } = useSession();
  const username = params.username as string;

  const [user, setUser] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [galleries, setGalleries] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Errore nel caricamento del profilo:", err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  const fetchPhotos = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/photos?userId=${user.id}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || data);
      }
    } catch {}
  }, [user]);

  const fetchAlbums = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/albums?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setAlbums(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, [user]);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/photos?favorites=${user.id}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.photos || data);
      }
    } catch {}
  }, [user]);

  const fetchGalleries = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/galleries?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setGalleries(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      fetchPhotos();
      fetchAlbums();
      fetchFavorites();
      fetchGalleries();
    }
  }, [user, fetchPhotos, fetchAlbums, fetchFavorites, fetchGalleries]);

  const isOwnProfile = session?.user && user && (session.user as any).id === user.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-24 h-24 rounded-full bg-white/5" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 bg-white/5" />
              <Skeleton className="h-4 w-32 bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <EmptyState icon={Users} title={t("profile.userNotFound")} description={t("profile.userNotFoundDesc")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Cover banner */}
        <div className="h-32 md:h-48 bg-gradient-to-br from-[#0063dc]/20 to-[#ff0084]/20" />

        <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
          {/* Profile header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Avatar className="h-28 w-28 border-4 border-[#0d0d0d] shrink-0">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="bg-[#0063dc] text-white text-3xl">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pt-2 sm:pt-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{user.name}</h1>
                <p className="text-white/40 text-sm">@{user.username}</p>
                {user.bio && <p className="text-white/60 text-sm mt-2 max-w-lg">{user.bio}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-white/30 flex-wrap">
                  {user.location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {user.location}</span>
                  )}
                  {user.website && (
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[#0063dc] transition-colors">
                      <Globe className="h-3 w-3" /> {user.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {t("profile.memberSince")} {format(new Date(user.createdAt), "MMMM yyyy", { locale: it })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-8">
                {!isOwnProfile && (
                  <>
                    <FollowButton userId={user.id} username={user.username} initialFollowing={isFollowing} />
                    <Link href="/messaggi">
                      <Button variant="outline" size="sm" className="gap-1.5 border-white/10 text-white/70 hover:bg-white/5">
                        <Mail className="h-4 w-4" /> {t("profile.sendMessage")}
                      </Button>
                    </Link>
                  </>
                )}
                {isOwnProfile && (
                  <Link href="/impostazioni">
                    <Button variant="outline" size="sm" className="gap-1.5 border-white/10 text-white/70 hover:bg-white/5">
                      {t("profile.editProfile")}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-white/30" />
              <span className="text-white/80 font-medium">{user.photoCount || photos.length}</span>
              <span className="text-white/40">{t("common.photos")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-white/30" />
              <span className="text-white/80 font-medium">{user.followerCount || 0}</span>
              <span className="text-white/40">{t("common.followers")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-white/30" />
              <span className="text-white/80 font-medium">{user.followingCount || 0}</span>
              <span className="text-white/40">{t("common.following")}</span>
            </div>
          </div>

          <Separator className="bg-white/5 my-6" />

          {/* Tabs */}
          <Tabs defaultValue="photos">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="photos" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 gap-1">
                <Camera className="h-4 w-4" /> {t("profile.photoStream")}
              </TabsTrigger>
              <TabsTrigger value="albums" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 gap-1">
                <FolderOpen className="h-4 w-4" /> {t("profile.albums")}
              </TabsTrigger>
              <TabsTrigger value="favorites" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 gap-1">
                <Heart className="h-4 w-4" /> {t("profile.favorites")}
              </TabsTrigger>
              <TabsTrigger value="galleries" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 gap-1">
                <LayoutGrid className="h-4 w-4" /> {t("profile.galleries")}
              </TabsTrigger>
              <TabsTrigger value="groups" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 gap-1">
                <Users className="h-4 w-4" /> {t("profile.groups")}
              </TabsTrigger>
            </TabsList>

            {/* Photos tab */}
            <TabsContent value="photos" className="mt-6">
              {photos.length === 0 ? (
                <EmptyState icon={Camera} title={t("profile.noPhotos")} description={isOwnProfile ? t("profile.noPhotosOwn") : t("profile.noPhotosOther")} />
              ) : (
                <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
                  {photos.map((photo: any, index: number) => (
                    <motion.div
                      key={photo.id}
                      className="break-inside-avoid"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.5) }}
                    >
                      <PhotoCard photo={photo} showSafety={false} />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Albums tab */}
            <TabsContent value="albums" className="mt-6">
              {albums.length === 0 ? (
                <EmptyState icon={FolderOpen} title={t("profile.noAlbums")} description={isOwnProfile ? t("profile.noAlbumsOwn") : t("profile.noAlbumsOther")} />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {albums.map((album: any) => (
                    <Link key={album.id} href={`/album/${album.id}`}>
                      <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow bg-white/5 border-white/10">
                        <CardContent className="p-0">
                          <div className="aspect-square relative bg-white/5 overflow-hidden">
                            {album.cover ? (
                              <img src={album.cover} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0063dc]/10 to-[#ff0084]/10">
                                <FolderOpen className="h-10 w-10 text-white/10" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-sm truncate text-white/80">{album.name}</h3>
                            <p className="text-xs text-white/30 mt-0.5">{album.photoCount || album.photos?.length || 0} {t("common.photos")}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Favorites tab */}
            <TabsContent value="favorites" className="mt-6">
              {favorites.length === 0 ? (
                <EmptyState icon={Heart} title={t("profile.noFavorites")} description={isOwnProfile ? t("profile.noFavoritesOwn") : t("profile.noFavoritesOther")} />
              ) : (
                <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
                  {favorites.map((photo: any, index: number) => (
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

            {/* Galleries tab */}
            <TabsContent value="galleries" className="mt-6">
              {galleries.length === 0 ? (
                <EmptyState icon={LayoutGrid} title={t("profile.noGalleries")} description={isOwnProfile ? t("profile.noGalleriesOwn") : t("profile.noGalleriesOther")} />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleries.map((gallery: any) => (
                    <Link key={gallery.id} href={`/gallerie/${gallery.id}`}>
                      <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow bg-white/5 border-white/10">
                        <CardContent className="p-0">
                          <div className="aspect-square relative bg-white/5 overflow-hidden">
                            {gallery.cover ? (
                              <img src={gallery.cover} alt={gallery.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff0084]/10 to-[#0063dc]/10">
                                <LayoutGrid className="h-10 w-10 text-white/10" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-sm truncate text-white/80">{gallery.name}</h3>
                            <p className="text-xs text-white/30 mt-0.5">{gallery.itemCount ?? 0} {t("common.photos")}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Groups tab */}
            <TabsContent value="groups" className="mt-6">
              {groups.length === 0 ? (
                <EmptyState icon={Users} title={t("profile.noGroups")} description={isOwnProfile ? t("profile.noGroupsOwn") : t("profile.noGroupsOther")} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.map((group: any) => (
                    <Link key={group.id} href={`/gruppi/${group.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0063dc]/20 to-[#ff0084]/20 flex items-center justify-center shrink-0">
                          {group.cover ? (
                            <img src={group.cover} alt={group.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <Users className="h-5 w-5 text-white/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/80 truncate">{group.name}</p>
                          <p className="text-xs text-white/30">{group.memberCount || 0} {t("common.members")}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-white/20 mt-8">
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">Memoro</span>
        <span className="ml-1">&mdash; {t("home.footerShort")}</span>
      </footer>
    </div>
  );
}
