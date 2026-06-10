"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import {
  Settings,
  User,
  Shield,
  Eye,
  Bell,
  Palette,
  Camera,
  Key,
  Trash2,
  Save,
  AlertTriangle,
  Globe,
  Lock,
  MessageSquare,
  Download,
  MessageCircle,
  Heart,
  Users,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";

type SettingsSection = "profile" | "privacy" | "content-filters" | "notifications" | "appearance" | "exif" | "account";

const sidebarItems: { key: SettingsSection; label: string; icon: typeof Settings }[] = [
  { key: "profile", label: "Il tuo profilo", icon: User },
  { key: "privacy", label: "Privacy e autorizzazioni", icon: Shield },
  { key: "content-filters", label: "Filtri contenuti", icon: Eye },
  { key: "notifications", label: "Notifiche", icon: Bell },
  { key: "appearance", label: "Aspetto", icon: Palette },
  { key: "exif", label: "EXIF", icon: Camera },
  { key: "account", label: "Account", icon: Key },
];

export default function ImpostazioniPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
  });
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
      // Also fetch profile data
      if (session?.user) {
        const profileRes = await fetch(`/api/users/${(session.user as any).username}`);
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setProfileData({
            name: profile.name || "",
            bio: profile.bio || "",
            location: profile.location || "",
            website: profile.website || "",
          });
        }
      }
    } catch (err) {
      console.error("Errore:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) fetchSettings();
  }, [session, fetchSettings]);

  const handleSaveSettings = useCallback(async (updates: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        toast.success("Impostazioni salvate");
      } else {
        toast.error("Errore nel salvataggio delle impostazioni");
      }
    } catch (err) {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  }, []);

  const handleSaveProfile = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${(session?.user as any)?.username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      if (res.ok) {
        toast.success("Profilo aggiornato");
      } else {
        toast.error("Errore nell'aggiornamento del profilo");
      }
    } catch {
      toast.error("Errore nell'aggiornamento");
    } finally {
      setSaving(false);
    }
  }, [session, profileData]);

  const handleUpdateSetting = useCallback((key: string, value: unknown) => {
    setSettings((prev: any) => {
      const updated = { ...prev, [key]: value };
      handleSaveSettings({ [key]: value });
      return updated;
    });
  }, [handleSaveSettings]);

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <EmptyState icon={Settings} title="Accedi per gestire le impostazioni" description="Effettua l'accesso per visualizzare e modificare le tue impostazioni" />
      </div>
    );
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            <div className="w-56 space-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full bg-white/5" />
              ))}
            </div>
            <div className="flex-1 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-white/5" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-1">
              <Settings className="h-8 w-8 text-white/30" />
              Impostazioni
            </h1>
            <p className="text-white/40 mb-6">Gestisci il tuo account e le tue preferenze</p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar navigation */}
            <nav className="lg:w-56 shrink-0 space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.key}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                    activeSection === item.key
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white/70 hover:bg-white/5"
                  }`}
                  onClick={() => setActiveSection(item.key)}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Profile section */}
              {activeSection === "profile" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Il tuo profilo</CardTitle>
                      <CardDescription className="text-white/40">Gestisci le informazioni del tuo profilo pubblico</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={(session.user as any).image || undefined} />
                          <AvatarFallback className="bg-[#0063dc] text-white text-2xl">
                            {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:bg-white/5">
                            Cambia avatar
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60 text-sm">Nome</Label>
                        <Input
                          value={profileData.name}
                          onChange={(e) => setProfileData((p) => ({ ...p, name: e.target.value }))}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60 text-sm">Bio</Label>
                        <Textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData((p) => ({ ...p, bio: e.target.value }))}
                          placeholder="Racconta qualcosa di te..."
                          rows={3}
                          className="bg-white/5 border-white/10 text-white resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white/60 text-sm">Posizione</Label>
                          <Input
                            value={profileData.location}
                            onChange={(e) => setProfileData((p) => ({ ...p, location: e.target.value }))}
                            placeholder="es. Roma, Italia"
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/60 text-sm">Sito web</Label>
                          <Input
                            value={profileData.website}
                            onChange={(e) => setProfileData((p) => ({ ...p, website: e.target.value }))}
                            placeholder="https://..."
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      </div>
                      <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#0063dc] hover:bg-[#0052b5] text-white gap-1.5">
                        <Save className="h-4 w-4" /> {saving ? "Salvataggio..." : "Salva profilo"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Privacy section */}
              {activeSection === "privacy" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Privacy e autorizzazioni</CardTitle>
                      <CardDescription className="text-white/40">Controlla chi può vedere e interagire con i tuoi contenuti</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-white/60 text-sm">Visibilità del profilo</Label>
                        <Select
                          value={settings.profileVisibility || "public"}
                          onValueChange={(v) => handleUpdateSetting("profileVisibility", v)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2a2a2d] border-white/10">
                            <SelectItem value="public"><span className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> Pubblico</span></SelectItem>
                            <SelectItem value="friends"><span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Solo contatti</span></SelectItem>
                            <SelectItem value="private"><span className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Privato</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-white/60 text-sm">Chi può inviarti messaggi</Label>
                        <Select
                          value={settings.allowMessages || "everyone"}
                          onValueChange={(v) => handleUpdateSetting("allowMessages", v)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2a2a2d] border-white/10">
                            <SelectItem value="everyone">Tutti</SelectItem>
                            <SelectItem value="contacts">Solo contatti</SelectItem>
                            <SelectItem value="nobody">Nessuno</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator className="bg-white/10" />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white/70 text-sm">Permetti commenti</Label>
                          <p className="text-xs text-white/30 mt-0.5">Consenti agli altri di commentare le tue foto</p>
                        </div>
                        <Switch
                          checked={settings.allowComments !== false}
                          onCheckedChange={(v) => handleUpdateSetting("allowComments", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white/70 text-sm">Permetti download</Label>
                          <p className="text-xs text-white/30 mt-0.5">Consenti agli altri di scaricare le tue foto</p>
                        </div>
                        <Switch
                          checked={settings.allowDownloads !== false}
                          onCheckedChange={(v) => handleUpdateSetting("allowDownloads", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white/70 text-sm">Mostra rullino</Label>
                          <p className="text-xs text-white/30 mt-0.5">Rendi visibile il tuo rullino agli altri utenti</p>
                        </div>
                        <Switch
                          checked={settings.showCameraRoll === true}
                          onCheckedChange={(v) => handleUpdateSetting("showCameraRoll", v)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Content Filters section - CRITICAL */}
              {activeSection === "content-filters" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Eye className="h-5 w-5" /> Filtri contenuti
                      </CardTitle>
                      <CardDescription className="text-white/40">Gestisci i filtri per i contenuti adulti</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* SafeSearch - Three options like Flickr */}
                      <div className="space-y-3">
                        <Label className="text-white/70 text-sm font-medium">Ricerca sicura (SafeSearch)</Label>
                        <RadioGroup
                          value={settings.safeSearch || "moderate"}
                          onValueChange={(v) => handleUpdateSetting("safeSearch", v)}
                          className="space-y-3"
                        >
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                            <RadioGroupItem value="strict" id="strict" className="mt-0.5 border-white/20" />
                            <div className="flex-1">
                              <Label htmlFor="strict" className="text-white/80 text-sm font-medium cursor-pointer">Rigorosa</Label>
                              <p className="text-xs text-white/30 mt-0.5">Nascondi tutti i contenuti maturi e limitati. Visualizza solo contenuti sicuri.</p>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px]">Sicuro</Badge>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0063dc]/5 border border-[#0063dc]/20">
                            <RadioGroupItem value="moderate" id="moderate" className="mt-0.5 border-white/20" />
                            <div className="flex-1">
                              <Label htmlFor="moderate" className="text-white/80 text-sm font-medium cursor-pointer">Moderata</Label>
                              <p className="text-xs text-white/30 mt-0.5">Mostra contenuti moderati ma nascondi quelli limitati. <span className="text-[#0063dc]">Predefinito</span></p>
                            </div>
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-[10px]">Moderato</Badge>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                            <RadioGroupItem value="off" id="off" className="mt-0.5 border-white/20" />
                            <div className="flex-1">
                              <Label htmlFor="off" className="text-white/80 text-sm font-medium cursor-pointer">Disattivata</Label>
                              <p className="text-xs text-white/30 mt-0.5">Mostra tutti i contenuti inclusi quelli limitati e per adulti.</p>
                            </div>
                            <Badge className="bg-red-500/20 text-red-400 border-0 text-[10px]">Restretto</Badge>
                          </div>
                        </RadioGroup>
                      </div>

                      <Separator className="bg-white/10" />

                      {/* Mature content toggles */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white/70 text-sm">Mostra contenuti per adulti</Label>
                            <p className="text-xs text-white/30 mt-0.5">Mostra/nascondi contenuti maturi nel tuo flusso foto</p>
                          </div>
                          <Switch
                            checked={settings.showMatureContent === true}
                            onCheckedChange={(v) => handleUpdateSetting("showMatureContent", v)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white/70 text-sm">Mostra contenuti limitati</Label>
                            <p className="text-xs text-white/30 mt-0.5">Mostra/nascondi contenuti con livello di sicurezza &quot;Restretto&quot;</p>
                          </div>
                          <Switch
                            checked={settings.showRestrictedContent === true}
                            onCheckedChange={(v) => handleUpdateSetting("showRestrictedContent", v)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white/70 text-sm">Consenti caricamenti per adulti</Label>
                            <p className="text-xs text-white/30 mt-0.5">Permetti il caricamento di contenuti con livello di sicurezza maturo o limitato</p>
                          </div>
                          <Switch
                            checked={settings.allowMatureUploads === true}
                            onCheckedChange={(v) => handleUpdateSetting("allowMatureUploads", v)}
                          />
                        </div>
                      </div>

                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-yellow-500/70">
                          I contenuti per adulti sono visibili solo agli utenti che hanno disattivato il filtro di ricerca sicura.
                          I contenuti limitati richiedono l&apos;impostazione &quot;Disattivata&quot; per essere visibili.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Notifications section */}
              {activeSection === "notifications" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Notifiche</CardTitle>
                      <CardDescription className="text-white/40">Scegli quali notifiche ricevere</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-white/30" />
                          <div>
                            <Label className="text-white/70 text-sm">Notifiche email</Label>
                            <p className="text-xs text-white/30">Ricevi aggiornamenti via email</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.emailNotifications !== false}
                          onCheckedChange={(v) => handleUpdateSetting("emailNotifications", v)}
                        />
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-[#ff0084]" />
                          <div>
                            <Label className="text-white/70 text-sm">Preferiti</Label>
                            <p className="text-xs text-white/30">Quando qualcuno aggiunge una tua foto ai preferiti</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.notifyFavorites !== false}
                          onCheckedChange={(v) => handleUpdateSetting("notifyFavorites", v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-green-500" />
                          <div>
                            <Label className="text-white/70 text-sm">Commenti</Label>
                            <p className="text-xs text-white/30">Quando qualcuno commenta le tue foto</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.notifyComments !== false}
                          onCheckedChange={(v) => handleUpdateSetting("notifyComments", v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-500" />
                          <div>
                            <Label className="text-white/70 text-sm">Nuovi follower</Label>
                            <p className="text-xs text-white/30">Quando qualcuno inizia a seguirti</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.notifyFollows !== false}
                          onCheckedChange={(v) => handleUpdateSetting("notifyFollows", v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-orange-500" />
                          <div>
                            <Label className="text-white/70 text-sm">Inviti ai gruppi</Label>
                            <p className="text-xs text-white/30">Quando vieni invitato a un gruppo</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.notifyGroupInvites !== false}
                          onCheckedChange={(v) => handleUpdateSetting("notifyGroupInvites", v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-[#0063dc]" />
                          <div>
                            <Label className="text-white/70 text-sm">Messaggi</Label>
                            <p className="text-xs text-white/30">Quando ricevi un nuovo messaggio</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.notifyMessages !== false}
                          onCheckedChange={(v) => handleUpdateSetting("notifyMessages", v)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Appearance section */}
              {activeSection === "appearance" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Aspetto</CardTitle>
                      <CardDescription className="text-white/40">Personalizza l&apos;aspetto di Memoro</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-white/70 text-sm">Tema</Label>
                        <div className="flex gap-3">
                          {[
                            { value: "dark", label: "Scuro", color: "bg-[#0d0d0d]" },
                            { value: "light", label: "Chiaro", color: "bg-[#f3f5f6]" },
                            { value: "system", label: "Sistema", color: "bg-gradient-to-br from-[#0d0d0d] to-[#f3f5f6]" },
                          ].map((t) => (
                            <button
                              key={t.value}
                              className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                                theme === t.value
                                  ? "border-[#0063dc] bg-[#0063dc]/5"
                                  : "border-white/10 hover:border-white/20"
                              }`}
                              onClick={() => setTheme(t.value)}
                            >
                              <div className={`w-12 h-8 rounded ${t.color} border border-white/10`} />
                              <span className="text-xs text-white/60">{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-white/70 text-sm">Vista predefinita</Label>
                        <Select
                          value={settings.defaultView || "grid"}
                          onValueChange={(v) => handleUpdateSetting("defaultView", v)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2a2a2d] border-white/10">
                            <SelectItem value="grid">Griglia</SelectItem>
                            <SelectItem value="list">Lista</SelectItem>
                            <SelectItem value="justified">Giustificata</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-white/70 text-sm">Lingua</Label>
                        <Select
                          value={settings.language || "it"}
                          onValueChange={(v) => handleUpdateSetting("language", v)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2a2a2d] border-white/10">
                            <SelectItem value="it">Italiano</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* EXIF section */}
              {activeSection === "exif" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Dati EXIF</CardTitle>
                      <CardDescription className="text-white/40">Gestisci la visibilità dei dati EXIF delle tue foto</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white/70 text-sm">Mostra dati EXIF</Label>
                          <p className="text-xs text-white/30 mt-0.5">Mostra i dati tecnici della fotocamera nelle tue foto (fotocamera, obiettivo, apertura, ISO, ecc.)</p>
                        </div>
                        <Switch
                          checked={settings.showEXIF !== false}
                          onCheckedChange={(v) => handleUpdateSetting("showEXIF", v)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Account section */}
              {activeSection === "account" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Cambia password</CardTitle>
                      <CardDescription className="text-white/40">Aggiorna la tua password per mantenere l&apos;account sicuro</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white/60 text-sm">Password attuale</Label>
                        <Input
                          type="password"
                          value={passwordData.current}
                          onChange={(e) => setPasswordData((p) => ({ ...p, current: e.target.value }))}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60 text-sm">Nuova password</Label>
                        <Input
                          type="password"
                          value={passwordData.new}
                          onChange={(e) => setPasswordData((p) => ({ ...p, new: e.target.value }))}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60 text-sm">Conferma nuova password</Label>
                        <Input
                          type="password"
                          value={passwordData.confirm}
                          onChange={(e) => setPasswordData((p) => ({ ...p, confirm: e.target.value }))}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <Button
                        onClick={async () => {
                          if (passwordData.new !== passwordData.confirm) {
                            toast.error("Le password non coincidono");
                            return;
                          }
                          toast.success("Password aggiornata");
                          setPasswordData({ current: "", new: "", confirm: "" });
                        }}
                        className="bg-[#0063dc] hover:bg-[#0052b5] text-white"
                      >
                        Aggiorna password
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-500/5 border-red-500/10">
                    <CardHeader>
                      <CardTitle className="text-red-400 text-lg flex items-center gap-2">
                        <Trash2 className="h-5 w-5" /> Elimina account
                      </CardTitle>
                      <CardDescription className="text-white/40">
                        Questa azione è irreversibile. Tutti i tuoi dati, foto e contenuti verranno eliminati permanentemente.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="gap-1.5">
                            <Trash2 className="h-4 w-4" /> Elimina il mio account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#2a2a2d] border-white/10">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Sei assolutamente sicuro?</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/50">
                              Questa azione non può essere annullata. Il tuo account e tutti i dati associati verranno eliminati permanentemente, incluse tutte le foto, album, gallerie e messaggi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/10 text-white/70">Annulla</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-500 hover:bg-red-600 text-white">
                              Sì, elimina il mio account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-white/20 mt-8">
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">Memoro</span>
        <span className="ml-1">&mdash; Condividi i Tuoi Ricordi</span>
      </footer>
    </div>
  );
}
