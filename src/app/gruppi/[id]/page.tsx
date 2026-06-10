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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { it } from "date-fns/locale";
import Link from "next/link";

export default function GruppoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const groupId = params.id as string;

  const [group, setGroup] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [newDiscussionBody, setNewDiscussionBody] = useState("");
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);

  const fetchGroup = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
        // Check if user is a member
        if (session?.user) {
          const memberRes = await fetch(`/api/groups/${groupId}`);
          // simplified check
        }
      }
    } catch (err) {
      console.error("Errore nel caricamento:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId, session]);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/photos`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(Array.isArray(data) ? data : data.photos || []);
      }
    } catch {}
  }, [groupId]);

  const fetchDiscussions = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/discussions`);
      if (res.ok) {
        const data = await res.json();
        setDiscussions(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
    fetchPhotos();
    fetchDiscussions();
  }, [fetchGroup, fetchPhotos, fetchDiscussions]);

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
      console.error("Errore:", err);
    } finally {
      setJoinLoading(false);
    }
  }, [groupId, isMember]);

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
      console.error("Errore:", err);
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
        <EmptyState icon={Users} title="Gruppo non trovato" description="Il gruppo richiesto non esiste o è stato eliminato" />
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
            <ArrowLeft className="h-4 w-4 mr-1" /> Tutti i Gruppi
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
                {group.isPublic ? "Pubblico" : "Privato"}
              </Badge>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {group.memberCount} membri</span>
              <span className="flex items-center gap-1"><ImageIcon className="h-4 w-4" /> {group.photoCount} foto</span>
              <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {group.discussionCount} discussioni</span>
            </div>
            <div className="flex items-center gap-2">
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
                    <><UserMinus className="h-4 w-4 mr-1" /> Lascia il gruppo</>
                  ) : (
                    <><UserPlus className="h-4 w-4 mr-1" /> Unisciti al gruppo</>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Rules */}
          {group.rules && (
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white/60 mb-2">Regole del gruppo</h3>
              <p className="text-sm text-white/40 whitespace-pre-wrap">{group.rules}</p>
            </div>
          )}

          <Separator className="bg-white/5" />

          {/* Tabs */}
          <Tabs defaultValue="photos">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="photos" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">
                <ImageIcon className="h-4 w-4 mr-1.5" /> Foto
              </TabsTrigger>
              <TabsTrigger value="discussions" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">
                <MessageSquare className="h-4 w-4 mr-1.5" /> Discussioni
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">
                <Users className="h-4 w-4 mr-1.5" /> Membri
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photos" className="mt-4">
              {photos.length === 0 ? (
                <EmptyState
                  icon={Camera}
                  title="Nessuna foto nel gruppo"
                  description="Unisciti al gruppo e condividi le tue foto"
                />
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
                      <PhotoCard photo={photo} />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="discussions" className="mt-4 space-y-4">
              {isMember && (
                <Button
                  size="sm"
                  onClick={() => setDiscussionOpen(true)}
                  className="bg-[#0063dc] hover:bg-[#0052b5] text-white gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Nuova discussione
                </Button>
              )}

              {discussions.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="Nessuna discussione"
                  description="Inizia una nuova discussione nel gruppo"
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
                              <span>di {discussion.author?.name || "Utente"}</span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" /> {discussion.replyCount || 0} risposte
                              </span>
                              <span>{format(new Date(discussion.createdAt), "d MMM yyyy", { locale: it })}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="mt-4">
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
                        <p className="text-sm font-medium text-white/80">{member.user?.name || "Utente"}</p>
                        <p className="text-xs text-white/30">{member.role || "membro"}</p>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <p className="text-sm text-white/30 col-span-full text-center py-8">
                    Informazioni sui membri non disponibili
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* New Discussion Dialog */}
      <Dialog open={discussionOpen} onOpenChange={setDiscussionOpen}>
        <DialogContent className="bg-[#2a2a2d] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Nuova Discussione</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Titolo della discussione"
              value={newDiscussionTitle}
              onChange={(e) => setNewDiscussionTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
            <Textarea
              placeholder="Scrivi il tuo messaggio..."
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
              {isCreatingDiscussion ? "Creazione..." : (
                <><Send className="h-4 w-4 mr-1.5" /> Crea discussione</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-white/20 mt-8">
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">Memoro</span>
        <span className="ml-1">&mdash; Condividi i Tuoi Ricordi</span>
      </footer>
    </div>
  );
}
