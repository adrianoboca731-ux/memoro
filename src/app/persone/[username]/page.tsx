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
  BarChart3,
  Film,
  Info,
  Eye,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { it, enUS, fr, de as deLocale, es as esLocale, ptBR, ja, ko, zhTW, zhCN } from "date-fns/locale";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const dateLocales: Record<string, any> = { it, en: enUS, fr, de: deLocale, es: esLocale, "pt-BR": ptBR, ja, ko, "zh-TW": zhTW, "zh-CN": zhCN };

const profileTabs = [
  { key: "info", icon: Info },
  { key: "photostream", icon: Camera },
  { key: "albums", icon: FolderOpen },
  { key: "favorites", icon: Heart },
  { key: "galleries", icon: LayoutGrid },
  { key: "groups", icon: Users },
  { key: "stats", icon: BarChart3 },
  { key: "cameraroll", icon: Film },
] as const;

type TabKey = typeof profileTabs[number]['key'];

export default function ProfiloPage() {
  const { t, locale } = useI18n();
  const dateLocale = dateLocales[locale] || it;
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
  const [activeTab, setActiveTab] = useState<TabKey>("photostream");

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
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

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/groups?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
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
      fetchGroups();
    }
  }, [user, fetchPhotos, fetchAlbums, fetchFavorites, fetchGalleries, fetchGroups]);

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

  const tabLabel = (key: TabKey): string => {
    const map: Record<TabKey, string> = {
      info: t("profile.tabInfo"),
      photostream: t("profile.tabPhotostream"),
      albums: t("profile.tabAlbums"),
      favorites: t("profile.tabFavorites"),
      galleries: t("profile.tabGalleries"),
      groups: t("profile.tabGroups"),
      stats: t("profile.tabStats"),
      cameraroll: t("profile.tabCameraroll"),
    };
    return map[key];
  };

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

          {/* Stats bar */}
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

          {/* Flickr-style tab navigation */}
          <div className="mt-6 border-b border-white/10">
            <nav className="flex items-center gap-0 overflow-x-auto -mb-px scrollbar-hide">
              {profileTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      isActive
                        ? "border-[#0063dc] text-white"
                        : "border-transparent text-white/40 hover:text-white/60 hover:border-white/20"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tabLabel(tab.key)}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab content */}
          <div className="mt-6 pb-12">
            {/* Info tab */}
            {activeTab === "info" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Info className="h-5 w-5 text-[#0063dc]" />
                        {t("profile.aboutUser")}
                      </h3>
                      {user.bio && (
                        <p className="text-white/60 text-sm leading-relaxed">{user.bio}</p>
                      )}
                      <div className="space-y-3 text-sm">
                        {user.location && (
                          <div className="flex items-center gap-2 text-white/40">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span>{user.location}</span>
                          </div>
                        )}
                        {user.website && (
                          <div className="flex items-center gap-2 text-white/40">
                            <Globe className="h-4 w-4 shrink-0" />
                            <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#0063dc] transition-colors">
                              {user.website.replace(/^https?:\/\//, "")}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-white/40">
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span>{t("profile.memberSince")} {format(new Date(user.createdAt), "MMMM yyyy", { locale: dateLocale })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-[#ff0084]" />
                        {t("profile.quickStats")}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-white">{user.photoCount || photos.length}</p>
                          <p className="text-xs text-white/40 mt-1">{t("common.photos")}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-white">{albums.length}</p>
                          <p className="text-xs text-white/40 mt-1">{t("profile.tabAlbums")}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-white">{user.followerCount || 0}</p>
                          <p className="text-xs text-white/40 mt-1">{t("common.followers")}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-white">{user.followingCount || 0}</p>
                          <p className="text-xs text-white/40 mt-1">{t("common.following")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Photostream tab */}
            {activeTab === "photostream" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
              </motion.div>
            )}

            {/* Albums tab */}
            {activeTab === "albums" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
              </motion.div>
            )}

            {/* Favorites tab */}
            {activeTab === "favorites" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
              </motion.div>
            )}

            {/* Galleries tab */}
            {activeTab === "galleries" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
              </motion.div>
            )}

            {/* Groups tab */}
            {activeTab === "groups" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
              </motion.div>
            )}

            {/* Stats tab */}
            {activeTab === "stats" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 text-center">
                      <ImageIcon className="h-6 w-6 text-[#0063dc] mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{user.photoCount || photos.length}</p>
                      <p className="text-xs text-white/40 mt-1">{t("common.photos")}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 text-center">
                      <Eye className="h-6 w-6 text-[#ff0084] mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{photos.reduce((acc: number, p: any) => acc + (p.views || 0), 0)}</p>
                      <p className="text-xs text-white/40 mt-1">{t("profile.totalViews")}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 text-center">
                      <Heart className="h-6 w-6 text-red-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{photos.reduce((acc: number, p: any) => acc + (p.favoriteCount || 0), 0)}</p>
                      <p className="text-xs text-white/40 mt-1">{t("profile.totalFavorites")}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 text-center">
                      <MessageSquare className="h-6 w-6 text-green-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{photos.reduce((acc: number, p: any) => acc + (p.commentCount || 0), 0)}</p>
                      <p className="text-xs text-white/40 mt-1">{t("profile.totalComments")}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-[#0063dc]" />
                      {t("profile.activityOverview")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-sm text-white/40">{t("profile.albumCount")}</p>
                        <p className="text-xl font-bold text-white mt-1">{albums.length}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-sm text-white/40">{t("profile.galleryCount")}</p>
                        <p className="text-xl font-bold text-white mt-1">{galleries.length}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-sm text-white/40">{t("profile.groupCount")}</p>
                        <p className="text-xl font-bold text-white mt-1">{groups.length}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-sm text-white/40">{t("profile.followerCount")}</p>
                        <p className="text-xl font-bold text-white mt-1">{user.followerCount || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Camera Roll tab */}
            {activeTab === "cameraroll" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {photos.length === 0 ? (
                  <EmptyState icon={Film} title={t("profile.noPhotos")} description={isOwnProfile ? t("profile.noPhotosOwn") : t("profile.noPhotosOther")} />
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      const groupedPhotos = photos.reduce((acc: Record<string, any[]>, photo) => {
                        const dateKey = format(new Date(photo.createdAt), "yyyy-MM-dd");
                        if (!acc[dateKey]) acc[dateKey] = [];
                        acc[dateKey].push(photo);
                        return acc;
                      }, {});
                      const sortedDates = Object.keys(groupedPhotos).sort(
                        (a, b) => new Date(b).getTime() - new Date(a).getTime()
                      );
                      return sortedDates.map((dateKey) => {
                        const datePhotos = groupedPhotos[dateKey];
                        const dateLabel = format(new Date(dateKey), "d MMMM yyyy", { locale: dateLocale });
                        return (
                          <div key={dateKey} className="space-y-2">
                            <h3 className="text-sm font-medium text-white/50">{dateLabel}</h3>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
                              {datePhotos.map((photo: any) => (
                                <Link key={photo.id} href={`/foto/${photo.id}`}>
                                  <div className="aspect-square overflow-hidden rounded-sm cursor-pointer relative group">
                                    <img
                                      src={photo.thumbnail || photo.filepath}
                                      alt={photo.title}
                                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                                      loading="lazy"
                                    />
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-white/20 mt-8">
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">Memoro</span>
        <span className="ml-1">&mdash; {t("home.footerShort")}</span>
      </footer>
    </div>
  );
}
