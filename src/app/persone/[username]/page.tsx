"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  ChevronDown,
  Search,
  ArrowUpDown,
  Grid3X3,
  List,
  Pencil,
  Upload,
  X,
  ImageIconLucide,
  Lock,
  Clock,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it, enUS, fr, de as deLocale, es as esLocale, ptBR, ja, ko, zhTW, zhCN } from "date-fns/locale";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const dateLocales: Record<string, any> = { it, en: enUS, fr, de: deLocale, es: esLocale, "pt-BR": ptBR, ja, ko, "zh-TW": zhTW, "zh-CN": zhCN };

// Flickr-style tabs: Info, Fotostream, Album, Preferite, Gallerie, Gruppi
const profileTabs = [
  { key: "info", labelKey: "profile.tabInfo" },
  { key: "photostream", labelKey: "profile.tabPhotostream" },
  { key: "albums", labelKey: "profile.tabAlbums" },
  { key: "favorites", labelKey: "profile.tabFavorites" },
  { key: "galleries", labelKey: "profile.tabGalleries" },
  { key: "groups", labelKey: "profile.tabGroups" },
] as const;

type TabKey = typeof profileTabs[number]['key'];

export default function ProfiloPage() {
  const { t, locale } = useI18n();
  const dateLocale = dateLocales[locale] || it;
  const params = useParams();
  const { data: session, update: updateSession } = useSession();
  const username = params.username as string;

  const [user, setUser] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [galleries, setGalleries] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("photostream");
  const [sortOrder, setSortOrder] = useState<"date" | "views" | "favorites">("date");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  // Cover & Logo upload states
  const [coverUploading, setCoverUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverHover, setCoverHover] = useState(false);
  const [logoHover, setLogoHover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (data.viewerFollowStatus) {
          setFollowStatus(data.viewerFollowStatus);
          setIsFollowing(data.viewerFollowStatus === "approved");
        }
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
      const res = await fetch(`/api/photos?userId=${user.id}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || data || []);
      }
    } catch (err) {
      console.error("Error fetching photos:", err);
      setPhotos([]);
    }
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
      const res = await fetch(`/api/photos?favorites=${user.id}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.photos || data || []);
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

  // Check if profile is viewable: own profile always visible, public profiles always visible
  // Private profiles only visible to approved followers
  const isApprovedFollower = followStatus === "approved";
  const isPendingFollower = followStatus === "pending";
  const isProfileVisible = isOwnProfile || user.isPublic !== false || isApprovedFollower;

  // Only fetch content if profile is visible
  const canViewContent = isOwnProfile || isProfileVisible;

  // Fetch pending follow requests for own private profile
  const fetchPendingRequests = useCallback(async () => {
    if (!isOwnProfile || user.isPublic !== false) return;
    try {
      const res = await fetch("/api/follows/pending");
      if (res.ok) {
        const data = await res.json();
        setPendingRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Error fetching pending requests:", err);
    }
  }, [isOwnProfile, user]);

  useEffect(() => {
    if (user && isOwnProfile) {
      fetchPendingRequests();
    }
  }, [user, isOwnProfile, fetchPendingRequests]);

  const handleApproveFollow = useCallback(async (followId: string) => {
    try {
      const res = await fetch(`/api/follows/${followId}/approve`, { method: "POST" });
      if (res.ok) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== followId));
        toast.success(t("profile.approveFollow"));
      }
    } catch (err) {
      console.error(err);
    }
  }, [t]);

  const handleRejectFollow = useCallback(async (followId: string) => {
    try {
      const res = await fetch(`/api/follows/${followId}/approve`, { method: "DELETE" });
      if (res.ok) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== followId));
        toast.success(t("profile.rejectFollow"));
      }
    } catch (err) {
      console.error(err);
    }
  }, [t]);

  const handleFollowStatusChange = useCallback((following: boolean, status: string | null) => {
    setIsFollowing(following);
    setFollowStatus(status);
  }, []);

  // Cover upload handler
  const handleCoverChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("profile.coverInvalidType"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("profile.coverTooLarge"));
      return;
    }

    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append("cover", file);
      const res = await fetch("/api/upload/cover", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setUser((prev: any) => ({ ...prev, coverImage: data.coverImage }));
        toast.success(t("profile.coverUpdated"));
      } else {
        const errData = await res.json();
        toast.error(errData.error || t("profile.coverUploadError"));
      }
    } catch {
      toast.error(t("profile.coverUploadError"));
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }, [t]);

  const handleCoverRemove = useCallback(async () => {
    setCoverUploading(true);
    try {
      const res = await fetch("/api/upload/cover", { method: "DELETE" });
      if (res.ok) {
        setUser((prev: any) => ({ ...prev, coverImage: null }));
        toast.success(t("profile.coverRemoved"));
      }
    } catch {
      toast.error(t("profile.coverUploadError"));
    } finally {
      setCoverUploading(false);
    }
  }, [t]);

  // Logo upload handler
  const handleLogoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("profile.logoInvalidType"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("profile.logoTooLarge"));
      return;
    }

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/upload/logo", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setUser((prev: any) => ({ ...prev, logoImage: data.logoImage }));
        toast.success(t("profile.logoUpdated"));
      } else {
        const errData = await res.json();
        toast.error(errData.error || t("profile.logoUploadError"));
      }
    } catch {
      toast.error(t("profile.logoUploadError"));
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }, [t]);

  const handleLogoRemove = useCallback(async () => {
    setLogoUploading(true);
    try {
      const res = await fetch("/api/upload/logo", { method: "DELETE" });
      if (res.ok) {
        setUser((prev: any) => ({ ...prev, logoImage: null }));
        toast.success(t("profile.logoRemoved"));
      }
    } catch {
      toast.error(t("profile.logoUploadError"));
    } finally {
      setLogoUploading(false);
    }
  }, [t]);

  // Sort photos based on selected order
  const sortedPhotos = useCallback((photoList: any[]) => {
    const list = [...photoList];
    switch (sortOrder) {
      case "views": return list.sort((a, b) => (b.views || 0) - (a.views || 0));
      case "favorites": return list.sort((a, b) => (b.favoriteCount || 0) - (a.favoriteCount || 0));
      default: return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="w-full h-56 rounded-xl bg-white/5" />
          <div className="flex items-center gap-4 -mt-16">
            <Skeleton className="w-28 h-28 rounded-full bg-white/5 border-4 border-[#0d0d0d]" />
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

  // Private profile - show limited info
  if (!isProfileVisible) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Cover - still show but no custom */}
          <div className="h-44 md:h-56 relative overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-[#0063dc]/20 to-[#ff0084]/20" />
          </div>
          <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
            <div className="flex items-end gap-5">
              <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-[#0d0d0d] shadow-xl">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="bg-[#0063dc] text-white text-4xl">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{user.name}</h1>
                  <FollowButton
                    userId={user.id}
                    username={user.username}
                    isPrivate={user.isPublic === false}
                    followStatus={followStatus}
                    onStatusChange={handleFollowStatusChange}
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-col items-center justify-center py-16">
              {isPendingFollower ? (
                <>
                  <Clock className="h-16 w-16 text-amber-500/30 mb-4" />
                  <h2 className="text-xl font-semibold text-amber-400/80 mb-2">{t("profile.followPending")}</h2>
                  <p className="text-white/30 text-sm text-center max-w-md">{t("profile.followPendingDesc")}</p>
                </>
              ) : (
                <>
                  <Lock className="h-16 w-16 text-white/10 mb-4" />
                  <h2 className="text-xl font-semibold text-white/60 mb-2">{t("profile.privateProfile")}</h2>
                  <p className="text-white/30 text-sm text-center max-w-md">{t("profile.privateProfileDesc")}</p>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Cover banner - custom image or blurred avatar or gradient */}
        <div
          className="h-44 md:h-64 relative overflow-hidden group"
          onMouseEnter={() => setCoverHover(true)}
          onMouseLeave={() => setCoverHover(false)}
        >
          {user.coverImage ? (
            <>
              <img
                src={user.coverImage}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0d0d0d]" />
            </>
          ) : user.avatar ? (
            <>
              <img
                src={user.avatar}
                alt=""
                className="w-full h-full object-cover blur-2xl scale-110 opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0d0d]/30 to-[#0d0d0d]" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0063dc]/30 to-[#ff0084]/30" />
          )}

          {/* Cover upload overlay - only for own profile */}
          {isOwnProfile && (
            <AnimatePresence>
              {(coverHover || coverUploading) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 z-10"
                >
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                  <Button
                    size="sm"
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white gap-1.5 border border-white/20"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={coverUploading}
                  >
                    {coverUploading ? (
                      <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {t("profile.changeCover")}
                  </Button>
                  {user.coverImage && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-red-500/30 backdrop-blur-sm hover:bg-red-500/50 text-white gap-1.5 border border-red-400/20"
                      onClick={handleCoverRemove}
                      disabled={coverUploading}
                    >
                      <X className="h-4 w-4" />
                      {t("profile.removeCover")}
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
          {/* Profile header - Flickr style */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-end gap-5">
              {/* Avatar + Logo container */}
              <div className="relative shrink-0">
                <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-[#0d0d0d] shadow-xl">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="bg-[#0063dc] text-white text-4xl">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Logo badge - bottom right of avatar */}
                {user.logoImage && (
                  <div
                    className="absolute -bottom-1 -right-1 w-12 h-12 md:w-14 md:h-14 rounded-full border-3 border-[#0d0d0d] overflow-hidden shadow-lg bg-white/10"
                    onMouseEnter={() => setLogoHover(true)}
                    onMouseLeave={() => setLogoHover(false)}
                  >
                    <img
                      src={user.logoImage}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                    {/* Logo remove overlay - only for own profile */}
                    {isOwnProfile && logoHover && (
                      <button
                        onClick={handleLogoRemove}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    )}
                  </div>
                )}

                {/* Logo upload button - only for own profile, shown when no logo */}
                {isOwnProfile && !user.logoImage && (
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full border-3 border-[#0d0d0d] bg-[#2a2a2d] hover:bg-[#3a3a3d] flex items-center justify-center shadow-lg transition-colors"
                    title={t("profile.addLogo")}
                  >
                    <Upload className="h-4 w-4 text-white/60" />
                  </button>
                )}

                {/* Hidden logo upload input */}
                {isOwnProfile && (
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                )}
              </div>

              {/* Name + actions */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{user.name}</h1>
                  {user.logoImage && isOwnProfile && (
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="text-white/30 hover:text-white/60 transition-colors"
                      title={t("profile.changeLogo")}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    {!isOwnProfile && (
                      <>
                        <FollowButton
                          userId={user.id}
                          username={user.username}
                          initialFollowing={isFollowing}
                          isPrivate={user.isPublic === false}
                          followStatus={followStatus}
                          onStatusChange={handleFollowStatusChange}
                        />
                        <Link href="/messaggi">
                          <Button variant="outline" size="sm" className="gap-1.5 border-white/10 text-white/70 hover:bg-white/5 h-8">
                            <Mail className="h-3.5 w-3.5" /> {t("profile.sendMessage")}
                          </Button>
                        </Link>
                      </>
                    )}
                    {isOwnProfile && (
                      <Link href="/impostazioni">
                        <Button variant="outline" size="sm" className="gap-1.5 border-white/10 text-white/70 hover:bg-white/5 h-8">
                          {t("profile.editProfile")}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile info row - Flickr style */}
            <div className="flex items-center gap-5 mt-3 text-sm text-white/40 flex-wrap">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4" />
                <span className="text-white/80 font-medium">{user.photoCount || photos.length}</span> {t("common.photos")}
              </span>
              {user.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {user.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {t("profile.memberSince")} {format(new Date(user.createdAt), "yyyy", { locale: dateLocale })}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span className="text-white/80 font-medium">{user.followerCount || 0}</span> {t("common.followers")}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span className="text-white/80 font-medium">{user.followingCount || 0}</span> {t("common.following")}
              </span>
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#0063dc] transition-colors">
                  <Globe className="h-4 w-4" />
                  {user.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </motion.div>

          {/* Pending follow requests - only for own private profile */}
          {isOwnProfile && user.isPublic === false && pendingRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4"
            >
              <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4" />
                {t("profile.pendingRequests")} ({pendingRequests.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingRequests.map((req: any) => (
                  <div
                    key={req.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={req.follower?.avatar || undefined} />
                      <AvatarFallback className="text-xs bg-[#0063dc] text-white">
                        {req.follower?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Link href={`/persone/${req.follower?.username}`} className="text-sm font-medium text-white/80 hover:underline truncate block">
                        {req.follower?.name}
                      </Link>
                      <p className="text-xs text-white/30">@{req.follower?.username}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                        onClick={() => handleApproveFollow(req.id)}
                      >
                        <Check className="h-3 w-3" />
                        {t("profile.approveFollow")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => handleRejectFollow(req.id)}
                      >
                        <X className="h-3 w-3" />
                        {t("profile.rejectFollow")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* No pending requests info */}
          {isOwnProfile && user.isPublic === false && pendingRequests.length === 0 && (
            <div className="mt-3 text-xs text-white/20">
              {t("profile.noPendingRequests")}
            </div>
          )}

          {/* Flickr-style tab navigation */}
          <div className="mt-5 border-b border-white/10">
            <nav className="flex items-center gap-0 -mb-px overflow-x-auto scrollbar-hide">
              {profileTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      isActive
                        ? "border-[#0063dc] text-white"
                        : "border-transparent text-white/40 hover:text-white/60 hover:border-white/20"
                    }`}
                  >
                    {t(tab.labelKey)}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sort bar for photo tabs */}
          {(activeTab === "photostream" || activeTab === "favorites") && (
            <div className="flex items-center justify-between mt-4 mb-2">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-white/60 hover:bg-white/5 gap-1 h-8 text-xs">
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      {sortOrder === "date" ? t("profile.sortByDate") : sortOrder === "views" ? t("profile.sortByViews") : t("profile.sortByFavorites")}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#2a2a2d] border-white/10">
                    <DropdownMenuItem className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer text-xs" onClick={() => setSortOrder("date")}>
                      {t("profile.sortByDate")}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer text-xs" onClick={() => setSortOrder("views")}>
                      {t("profile.sortByViews")}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer text-xs" onClick={() => setSortOrder("favorites")}>
                      {t("profile.sortByFavorites")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* Tab content */}
          <div className="mt-2 pb-12">
            {/* Info tab */}
            {activeTab === "info" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white">{t("profile.aboutUser")}</h3>
                      {user.bio ? (
                        <p className="text-white/60 text-sm leading-relaxed">{user.bio}</p>
                      ) : (
                        <p className="text-white/30 text-sm italic">
                          {isOwnProfile ? t("profile.addYourBio") : t("profile.noBio")}
                        </p>
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
                      <h3 className="text-lg font-semibold text-white">{t("profile.quickStats")}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-xl font-bold text-white">{user.photoCount || photos.length}</p>
                          <p className="text-xs text-white/40 mt-0.5">{t("common.photos")}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-xl font-bold text-white">{albums.length}</p>
                          <p className="text-xs text-white/40 mt-0.5">{t("profile.tabAlbums")}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-xl font-bold text-white">{user.followerCount || 0}</p>
                          <p className="text-xs text-white/40 mt-0.5">{t("common.followers")}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <p className="text-xl font-bold text-white">{user.followingCount || 0}</p>
                          <p className="text-xs text-white/40 mt-0.5">{t("common.following")}</p>
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
                  <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
                    {sortedPhotos(photos).map((photo: any, index: number) => (
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
                {isOwnProfile && (
                  <div className="mb-4">
                    <Link href="/album">
                      <Button size="sm" className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white gap-1.5">
                        <FolderOpen className="h-4 w-4" /> {t("albums.createNew")}
                      </Button>
                    </Link>
                  </div>
                )}
                {albums.length === 0 ? (
                  <EmptyState icon={FolderOpen} title={t("profile.noAlbums")} description={isOwnProfile ? t("profile.noAlbumsOwn") : t("profile.noAlbumsOther")} />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                  <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
                    {sortedPhotos(favorites).map((photo: any, index: number) => (
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
                {isOwnProfile && (
                  <div className="mb-4">
                    <Link href="/gallerie">
                      <Button size="sm" className="bg-gradient-to-r from-[#ff0084] to-[#0063dc] hover:opacity-90 text-white gap-1.5">
                        <LayoutGrid className="h-4 w-4" /> {t("galleries.createNew")}
                      </Button>
                    </Link>
                  </div>
                )}
                {galleries.length === 0 ? (
                  <EmptyState icon={LayoutGrid} title={t("profile.noGalleries")} description={isOwnProfile ? t("profile.noGalleriesOwn") : t("profile.noGalleriesOther")} />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                {isOwnProfile && (
                  <div className="mb-4">
                    <Link href="/gruppi">
                      <Button size="sm" className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white gap-1.5">
                        <Users className="h-4 w-4" /> {t("groups.createGroup")}
                      </Button>
                    </Link>
                  </div>
                )}
                {groups.length === 0 ? (
                  <EmptyState icon={Users} title={t("profile.noGroups")} description={isOwnProfile ? t("profile.noGroupsOwn") : t("profile.noGroupsOther")} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group: any) => (
                      <Link key={group.id} href={`/gruppi/${group.id}`}>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
                          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#0063dc]/20 to-[#ff0084]/20 flex items-center justify-center shrink-0 overflow-hidden">
                            {group.cover ? (
                              <img src={group.cover} alt={group.name} className="w-14 h-14 rounded-lg object-cover" />
                            ) : (
                              <Users className="h-6 w-6 text-white/20" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/80 truncate">{group.name}</p>
                            <p className="text-xs text-white/30">{group.memberCount || 0} {t("common.members")} · {group.photoCount || 0} {t("common.photos")}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
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
