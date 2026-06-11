"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/header";
import { PhotoCard } from "@/components/photo-card";
import { EmptyState } from "@/components/empty-state";
import {
  ArrowLeft,
  Users,
  Globe,
  Lock,
  Image as ImageIcon,
  MessageSquare,
  UserPlus,
  UserMinus,
  Plus,
  Send,
  Camera,
  Check,
  X,
  Clock,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { it, enUS, fr, de as deLocale, es as esLocale, ptBR, ja, ko, zhTW, zhCN } from "date-fns/locale";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const dateLocales: Record<string, any> = { it, en: enUS, fr, de: deLocale, es: esLocale, "pt-BR": ptBR, ja, ko, "zh-TW": zhTW, "zh-CN": zhCN };

export default function GruppoDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const groupId = params.id as string;

  const [group, setGroup] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [myPhotos, setMyPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdminOrMod, setIsAdminOrMod] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [newDiscussionBody, setNewDiscussionBody] = useState("");
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [submitPhotoOpen, setSubmitPhotoOpen] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);
  const [activeTab, setActiveTab] = useState("photos");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const dateLocale = dateLocales[locale] || it;

  const fetchGroup = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
        if (session?.user) {
          const userId = (session.user as any).id;
          const membership = data.members?.find((m: any) => m.userId === userId);
          if (membership) {
            setIsMember(true);
            setIsAdminOrMod(membership.role === 'admin' || membership.role === 'moderator');
          }
        }
      }
    } catch (err) {
      console.error("Error loading:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId, session]);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/photos`);
      if (res.ok) {
        const data = await res.json();
        const approved = (Array.isArray(data) ? data : data.photos || []).filter((p: any) => p.status === 'approved');
        setPhotos(approved);
      }
    } catch {}
  }, [groupId]);

  const fetchPendingPhotos = useCallback(async () => {
    if (!isAdminOrMod) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/photos?status=pending`);
      if (res.ok) {
        const data = await res.json();
        setPendingPhotos(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, [groupId, isAdminOrMod]);

  const fetchDiscussions = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/discussions`);
      if (res.ok) {
        const data = await res.json();
        setDiscussions(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, [groupId]);

  const fetchMyPhotos = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/photos?limit=100");
      if (res.ok) {
        const data = await res.json();
        setMyPhotos(data.photos || data);
      }
    } catch {}
  }, [session]);

  useEffect(() => {
    fetchGroup();
    fetchPhotos();
    fetchDiscussions();
  }, [fetchGroup, fetchPhotos, fetchDiscussions]);

  useEffect(() => {
    if (isAdminOrMod) fetchPendingPhotos();
  }, [isAdminOrMod, fetchPendingPhotos]);

  const handleJoinLeave = useCallback(async () => {
    setJoinLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: isMember ? "DELETE" : "POST",
      });
      if (res.ok) {
        setIsMember(!isMember);
        setGroup((prev: any) => ({
          ...prev,
          memberCount: isMember ? prev.memberCount - 1 : prev.memberCount + 1,
        }));
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setJoinLoading(false);
    }
  }, [groupId, isMember]);

  const handleSubmitPhoto = useCallback(async () => {
    if (!selectedPhotoId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: selectedPhotoId }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.status === 'approved') {
          setPhotos((prev) => [result, ...prev]);
        }
        setSubmitPhotoOpen(false);
        setSelectedPhotoId("");
        // Refresh photos
        fetchPhotos();
      } else {
        const err = await res.json();
        alert(err.error || t("groups.errorSubmitting"));
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [groupId, selectedPhotoId, fetchPhotos, t]);

  const handleApproveReject = useCallback(async (photoId: string, status: 'approved' | 'rejected') => {
    setApprovingId(photoId);
    try {
      const res = await fetch(`/api/groups/${groupId}/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setPendingPhotos((prev) => prev.filter((p: any) => p.photoId !== photoId));
        if (status === 'approved') {
          fetchPhotos();
        }
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setApprovingId(null);
    }
  }, [groupId, fetchPhotos]);

  const handleCreateDiscussion = useCallback(async () => {
    if (!newDiscussionTitle.trim() || !newDiscussionBody.trim()) return;
    setIsCreatingDiscussion(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newDiscussionTitle, body: newDiscussionBody }),
      });
      if (res.ok) {
        const discussion = await res.json();
        setDiscussions((prev) => [discussion, ...prev]);
        setNewDiscussionTitle("");
        setNewDiscussionBody("");
        setDiscussionOpen(false);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsCreatingDiscussion(false);
    }
  }, [groupId, newDiscussionTitle, newDiscussionBody]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-48 bg-white/5" />
          <Skeleton className="h-48 w-full rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <EmptyState icon={Users} title={t("groups.groupNotFound")} description={t("groups.groupNotFoundDesc")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Back */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/gruppi")}
            className="text-white/50 hover:text-white hover:bg-white/5 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("groups.allGroupsNav")}
          </Button>

          {/* Group banner */}
          <div className="relative rounded-xl overflow-hidden">
            {group.cover ? (
              <div className="h-48 md:h-64 relative">
                <img src={group.cover} alt={group.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{group.name}</h1>
                  {group.description && (
                    <p className="text-white/60 mt-1 text-sm max-w-xl">{group.description}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-32 md:h-48 bg-gradient-to-br from-[#0063dc]/30 to-[#ff0084]/30 flex items-end p-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{group.name}</h1>
              </div>
            )}
          </div>

          {/* Group info bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-sm text-white/50">
              <Badge variant="secondary" className="gap-1 bg-white/10 text-white/60 border-0">
                {group.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {group.isPublic ? t("groups.public") : t("groups.private")}
              </Badge>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {group.memberCount} {t("common.members")}</span>
              <span className="flex items-center gap-1"><ImageIcon className="h-4 w-4" /> {group.photoCount} {t("common.photos")}</span>
              <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {group.discussionCount} {t("groups.discussions").toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              {session?.user && isMember && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    fetchMyPhotos();
                    setSubmitPhotoOpen(true);
                  }}
                  className="gap-1.5 border-white/10 text-white/70 hover:bg-white/5"
                >
                  <ImagePlus className="h-4 w-4" /> {t("groups.submitPhoto")}
                </Button>
              )}
              {session?.user && (
                <Button
                  variant={isMember ? "outline" : "default"}
                  size="sm"
                  onClick={handleJoinLeave}
                  disabled={joinLoading}
                  className={
                    isMember
                      ? "border-white/20 text-white/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                      : "bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white"
                  }
                >
                  {isMember ? (
                    <><UserMinus className="h-4 w-4 mr-1" /> {t("groups.leaveGroup")}</>
                  ) : (
                    <><UserPlus className="h-4 w-4 mr-1" /> {t("groups.joinGroup")}</>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Rules */}
          {group.rules && (
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white/60 mb-2">{t("groups.groupRulesTitle")}</h3>
              <p className="text-sm text-white/40 whitespace-pre-wrap">{group.rules}</p>
            </div>
          )}

          <Separator className="bg-white/5" />

          {/* Pending photos section for admins */}
          {isAdminOrMod && pendingPhotos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                {t("groups.pendingPhotos")} ({pendingPhotos.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingPhotos.map((gp: any) => (
                  <Card key={gp.id} className="bg-white/5 border-yellow-500/20 overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <div className="w-20 h-20 rounded overflow-hidden shrink-0 bg-white/5">
                          {gp.photo?.thumbnail || gp.photo?.filepath ? (
                            <img
                              src={gp.photo.thumbnail || gp.photo.filepath}
                              alt={gp.photo?.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-white/10" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/80 truncate">{gp.photo?.title}</p>
                          <p className="text-xs text-white/30 mt-0.5">
                            {t("groups.submittedBy")} {gp.photo?.user?.name || t("common.user")}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                              onClick={() => handleApproveReject(gp.photoId, 'approved')}
                              disabled={approvingId === gp.photoId}
                            >
                              <Check className="h-3 w-3" /> {t("groups.approve")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1"
                              onClick={() => handleApproveReject(gp.photoId, 'rejected')}
                              disabled={approvingId === gp.photoId}
                            >
                              <X className="h-3 w-3" /> {t("groups.reject")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Separator className="bg-white/5" />
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-white/10">
            <nav className="flex items-center gap-0 -mb-px overflow-x-auto">
              {[
                { key: "photos", icon: ImageIcon, label: t("groups.photos") },
                { key: "discussions", icon: MessageSquare, label: t("groups.discussions") },
                { key: "members", icon: Users, label: t("groups.membersList") },
              ].map((tab) => {
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
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Photos tab */}
          {activeTab === "photos" && (
            <div className="mt-4">
              {photos.length === 0 ? (
                <EmptyState
                  icon={Camera}
                  title={t("groups.noPhotosInGroup")}
                  description={isMember ? t("groups.noPhotosInGroupDescMember") : t("groups.noPhotosInGroupDesc")}
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((gp: any, index: number) => {
                    const photo = gp.photo || gp;
                    return (
                      <motion.div
                        key={gp.id || photo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.5) }}
                      >
                        <PhotoCard photo={photo} flickrStyle />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Discussions tab */}
          {activeTab === "discussions" && (
            <div className="mt-4 space-y-4">
              {isMember && (
                <Button
                  size="sm"
                  onClick={() => setDiscussionOpen(true)}
                  className="bg-[#0063dc] hover:bg-[#0052b5] text-white gap-1.5"
                >
                  <Plus className="h-4 w-4" /> {t("groups.newDiscussion")}
                </Button>
              )}

              {discussions.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title={t("groups.noDiscussions")}
                  description={t("groups.noDiscussionsDesc")}
                />
              ) : (
                <div className="space-y-3">
                  {discussions.map((discussion: any) => (
                    <motion.div key={discussion.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Link href={`/gruppi/${groupId}/discussioni/${discussion.id}`}>
                        <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors cursor-pointer">
                          <CardContent className="p-4">
                            <h3 className="font-medium text-white/80 text-sm">{discussion.title}</h3>
                            <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                              <span>{t("common.by")} {discussion.author?.name || t("common.user")}</span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" /> {discussion.replyCount || 0} {t("groups.replies")}
                              </span>
                              <span>{format(new Date(discussion.createdAt), "d MMM yyyy", { locale: dateLocale })}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Members tab */}
          {activeTab === "members" && (
            <div className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {members.length > 0 ? members.map((member: any) => (
                  <Link key={member.id} href={`/persone/${member.user?.username || ""}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.user?.avatar || undefined} />
                        <AvatarFallback className="bg-[#0063dc] text-white text-sm">
                          {member.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white/80">{member.user?.name || t("common.user")}</p>
                        <p className="text-xs text-white/30">{member.role || t("common.member")}</p>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <p className="text-sm text-white/30 col-span-full text-center py-8">
                    {t("groups.memberInfoUnavailable")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Submit Photo Dialog */}
      <Dialog open={submitPhotoOpen} onOpenChange={setSubmitPhotoOpen}>
        <DialogContent className="bg-[#2a2a2d] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-[#0063dc]" />
              {t("groups.submitPhotoTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-white/50">{t("groups.submitPhotoDesc")}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto">
              {myPhotos.map((photo: any) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhotoId(photo.id)}
                  className={`aspect-square rounded overflow-hidden relative ${
                    selectedPhotoId === photo.id ? "ring-2 ring-[#0063dc]" : ""
                  }`}
                >
                  <img
                    src={photo.thumbnail || photo.filepath}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                  />
                  {selectedPhotoId === photo.id && (
                    <div className="absolute inset-0 bg-[#0063dc]/30 flex items-center justify-center">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  )}
                </button>
              ))}
              {myPhotos.length === 0 && (
                <p className="text-sm text-white/30 col-span-full text-center py-4">
                  {t("groups.noPhotosToSubmit")}
                </p>
              )}
            </div>
            <Button
              onClick={handleSubmitPhoto}
              disabled={!selectedPhotoId || isSubmitting}
              className="w-full bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white"
            >
              {isSubmitting ? t("common.sending") : (
                <><Send className="h-4 w-4 mr-1.5" /> {t("groups.submitPhotoButton")}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Discussion Dialog */}
      <Dialog open={discussionOpen} onOpenChange={setDiscussionOpen}>
        <DialogContent className="bg-[#2a2a2d] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{t("discussion.newTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t("groups.discussionTitle")}
              value={newDiscussionTitle}
              onChange={(e) => setNewDiscussionTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
            <Textarea
              placeholder={t("groups.discussionBody")}
              value={newDiscussionBody}
              onChange={(e) => setNewDiscussionBody(e.target.value)}
              rows={5}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
            />
            <Button
              onClick={handleCreateDiscussion}
              disabled={!newDiscussionTitle.trim() || !newDiscussionBody.trim() || isCreatingDiscussion}
              className="w-full bg-[#0063dc] hover:bg-[#0052b5] text-white"
            >
              {isCreatingDiscussion ? t("common.creating") : (
                <><Send className="h-4 w-4 mr-1.5" /> {t("groups.createDiscussion")}</>
              )}
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
