"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Upload,
  Image as ImageIconLucide,
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
import { useI18n } from "@/lib/i18n";

type SettingsSection = "profile" | "privacy" | "content-filters" | "notifications" | "appearance" | "exif" | "account";

export default function ImpostazioniPage() {
  const { t } = useI18n();
  const { data: session, update: updateSession } = useSession();
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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const sidebarItems: { key: SettingsSection; label: string; icon: typeof Settings }[] = [
    { key: "profile", label: t("settings.profile"), icon: User },
    { key: "privacy", label: t("settings.privacy"), icon: Shield },
    { key: "content-filters", label: t("settings.contentFilters"), icon: Eye },
    { key: "notifications", label: t("settings.notifications"), icon: Bell },
    { key: "appearance", label: t("settings.appearance"), icon: Palette },
    { key: "exif", label: t("settings.exif"), icon: Camera },
    { key: "account", label: t("settings.account"), icon: Key },
  ];

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
          setCoverUrl(profile.coverImage || null);
          setLogoUrl(profile.logoImage || null);
        }
      }
    } catch (err) {
      console.error("Error:", err);
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
        toast.success(t("settings.settingsSaved"));
      } else {
        toast.error(t("settings.saveError"));
      }
    } catch (err) {
      toast.error(t("settings.saveError"));
    } finally {
      setSaving(false);
    }
  }, [t]);

  const handleSaveProfile = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${(session?.user as any)?.username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      if (res.ok) {
        toast.success(t("settings.profileUpdated"));
      } else {
        toast.error(t("settings.profileUpdateError"));
      }
    } catch {
      toast.error(t("settings.profileUpdateError"));
    } finally {
      setSaving(false);
    }
  }, [session, profileData, t]);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("settings.avatarInvalidType"));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("settings.avatarTooLarge"));
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.avatar);
        toast.success(t("settings.avatarUpdated"));
        // Force session refresh to show new avatar in header
        await updateSession({ image: data.avatar });
      } else {
        const errData = await res.json();
        toast.error(errData.error || t("settings.avatarUploadError"));
      }
    } catch {
      toast.error(t("settings.avatarUploadError"));
    } finally {
      setAvatarUploading(false);
      // Reset file input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  }, [t]);

  const handleRemoveAvatar = useCallback(async () => {
    setAvatarUploading(true);
    try {
      const res = await fetch("/api/upload/avatar", {
        method: "DELETE",
      });

      if (res.ok) {
        setAvatarUrl(null);
        toast.success(t("settings.avatarRemoved"));
        // Force session refresh
        await updateSession({ image: null });
      } else {
        toast.error(t("settings.avatarUploadError"));
      }
    } catch {
      toast.error(t("settings.avatarUploadError"));
    } finally {
      setAvatarUploading(false);
    }
  }, [t]);

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
        setCoverUrl(data.coverImage);
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
        setCoverUrl(null);
        toast.success(t("profile.coverRemoved"));
      }
    } catch {
      toast.error(t("profile.coverUploadError"));
    } finally {
      setCoverUploading(false);
    }
  }, [t]);

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
        setLogoUrl(data.logoImage);
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
        setLogoUrl(null);
        toast.success(t("profile.logoRemoved"));
      }
    } catch {
      toast.error(t("profile.logoUploadError"));
    } finally {
      setLogoUploading(false);
    }
  }, [t]);

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
        <EmptyState icon={Settings} title={t("settings.loginToManage")} description={t("settings.loginToManageDesc")} />
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
              {t("settings.title")}
            </h1>
            <p className="text-white/40 mb-6">{t("settings.subtitle")}</p>
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
                      <CardTitle className="text-white text-lg">{t("settings.profileTitle")}</CardTitle>
                      <CardDescription className="text-white/40">{t("settings.profileDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={avatarUrl || (session.user as any).image || undefined} />
                            <AvatarFallback className="bg-[#0063dc] text-white text-2xl">
                              {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          {avatarUploading && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                              <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                          )}
                          {!avatarUploading && (
                            <div
                              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={() => avatarInputRef.current?.click()}
                            >
                              <Camera className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/10 text-white/70 hover:bg-white/5"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={avatarUploading}
                          >
                            <Camera className="h-4 w-4 mr-1.5" />
                            {t("settings.changeAvatar")}
                          </Button>
                          {((session.user as any).image || avatarUrl) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400/70 hover:text-red-400 hover:bg-red-400/5 text-xs h-7"
                              onClick={handleRemoveAvatar}
                              disabled={avatarUploading}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {t("settings.removeAvatar")}
                            </Button>
                          )}
                          <p className="text-[11px] text-white/25">{t("settings.avatarHint")}</p>
                        </div>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60 text-sm">{t("settings.name")}</Label>
                        <Input
                          value={profileData.name}
                          onChange={(e) => setProfileData((p) => ({ ...p, name: e.target.value }))}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60 text-sm">{t("settings.bio")}</Label>
                        <Textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData((p) => ({ ...p, bio: e.target.value }))}
                          placeholder={t("settings.bioPlaceholder")}
                          rows={3}
                          className="bg-white/5 border-white/10 text-white resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white/60 text-sm">{t("settings.location")}</Label>
                          <Input
                            value={profileData.location}
                            onChange={(e) => setProfileData((p) => ({ ...p, location: e.target.value }))}
                            placeholder={t("settings.locationPlaceholder")}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/60 text-sm">{t("settings.website")}</Label>
                          <Input
                            value={profileData.website}
                            onChange={(e) => setProfileData((p) => ({ ...p, website: e.target.value }))}
                            placeholder="https://..."
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      </div>
                      <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#0063dc] hover:bg-[#0052b5] text-white gap-1.5">
                        <Save className="h-4 w-4" /> {saving ? t("common.saving") : t("settings.saveProfile")}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Cover Image Card */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">{t("profile.coverTitle")}</CardTitle>
                      <CardDescription className="text-white/40">{t("profile.coverDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative group">
                        <div className="h-36 rounded-xl overflow-hidden bg-gradient-to-br from-[#0063dc]/20 to-[#ff0084]/20">
                          {coverUrl ? (
                            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIconLucide className="h-10 w-10 text-white/10" />
                            </div>
                          )}
                          {coverUploading && (
                            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                              <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        {!coverUploading && (
                          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10 gap-1.5"
                              onClick={() => coverInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4" />
                              {t("profile.changeCover")}
                            </Button>
                            {coverUrl && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-1.5"
                                onClick={handleCoverRemove}
                              >
                                <Trash2 className="h-4 w-4" />
                                {t("profile.removeCover")}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleCoverChange}
                      />
                      <p className="text-[11px] text-white/25">{t("profile.coverHint")}</p>
                    </CardContent>
                  </Card>

                  {/* Logo Image Card */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">{t("profile.logoTitle")}</CardTitle>
                      <CardDescription className="text-white/40">{t("profile.logoDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          <div className="h-20 w-20 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIconLucide className="h-8 w-8 text-white/10" />
                            )}
                            {logoUploading && (
                              <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              </div>
                            )}
                            {!logoUploading && (
                              <div
                                className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => logoInputRef.current?.click()}
                              >
                                <Camera className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/10 text-white/70 hover:bg-white/5"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={logoUploading}
                          >
                            <Upload className="h-4 w-4 mr-1.5" />
                            {t("profile.changeLogo")}
                          </Button>
                          {logoUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400/70 hover:text-red-400 hover:bg-red-400/5 text-xs h-7"
                              onClick={handleLogoRemove}
                              disabled={logoUploading}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {t("profile.removeLogo")}
                            </Button>
                          )}
                          <p className="text-[11px] text-white/25">{t("profile.logoHint")}</p>
                        </div>
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={handleLogoChange}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Privacy section */}
              {activeSection === "privacy" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">{t("settings.privacyTitle")}</CardTitle>
                      <CardDescription className="text-white/40">{t("settings.privacyDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-white/60 text-sm">{t("settings.profileVisibility")}</Label>
                        <Select
                          value={settings.profileVisibility || "public"}
                          onValueChange={(v) => handleUpdateSetting("profileVisibility", v)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2a2a2d] border-white/10">
                            <SelectItem value="public"><span className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> {t("settings.public")}</span></SelectItem>
                            <SelectItem value="friends"><span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> {t("settings.contactsOnly")}</span></SelectItem>
                            <SelectItem value="private"><span className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> {t("settings.private")}</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-white/60 text-sm">{t("settings.whoCanMessage")}</Label>
                        <Select
                          value={settings.allowMessages || "everyone"}
                          onValueChange={(v) => handleUpdateSetting("allowMessages", v)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2a2a2d] border-white/10">
                            <SelectItem value="everyone">{t("settings.everyone")}</SelectItem>
                            <SelectItem value="contacts">{t("settings.contactsOnly")}</SelectItem>
                            <SelectItem value="nobody">{t("settings.nobody")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator className="bg-white/10" />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white/70 text-sm">{t("settings.allowComments")}</Label>
                          <p className="text-xs text-white/30 mt-0.5">{t("settings.allowCommentsDesc")}</p>
                        </div>
                        <Switch
                          checked={settings.allowComments !== false}
                          onCheckedChange={(v) => handleUpdateSetting("allowComments", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white/70 text-sm">{t("settings.allowDownloads")}</Label>
                          <p className="text-xs text-white/30 mt-0.5">{t("settings.allowDownloadsDesc")}</p>
                        </div>
                        <Switch
                          checked={settings.allowDownloads !== false}
                          onCheckedChange={(v) => handleUpdateSetting("allowDownloads", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white/70 text-sm">{t("settings.showCameraRoll")}</Label>
                          <p className="text-xs text-white/30 mt-0.5">{t("settings.showCameraRollDesc")}</p>
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
                        <Eye className="h-5 w-5" /> {t("settings.contentFiltersTitle")}
                      </CardTitle>
                      <CardDescription className="text-white/40">{t("settings.contentFiltersDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* SafeSearch - Three options like Flickr */}
                      <div className="space-y-3">
                        <Label className="text-white/70 text-sm font-medium">{t("settings.safeSearch")}</Label>
                        <RadioGroup
                          value={settings.safeSearch || "moderate"}
                          onValueChange={(v) => handleUpdateSetting("safeSearch", v)}
                          className="space-y-3"
                        >
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                            <RadioGroupItem value="strict" id="strict" className="mt-0.5 border-white/20" />
                            <div className="flex-1">
                              <Label htmlFor="strict" className="text-white/80 text-sm font-medium cursor-pointer">{t("settings.strict")}</Label>
                              <p className="text-xs text-white/30 mt-0.5">{t("settings.strictDesc")}</p>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px]">{t("safety.safe")}</Badge>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0063dc]/5 border border-[#0063dc]/20">
                            <RadioGroupItem value="moderate" id="moderate" className="mt-0.5 border-white/20" />
                            <div className="flex-1">
                              <Label htmlFor="moderate" className="text-white/80 text-sm font-medium cursor-pointer">{t("settings.moderate")}</Label>
                              <p className="text-xs text-white/30 mt-0.5">{t("settings.moderateDesc")} <span className="text-[#0063dc]">{t("settings.default")}</span></p>
                            </div>
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-[10px]">{t("safety.moderate")}</Badge>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                            <RadioGroupItem value="off" id="off" className="mt-0.5 border-white/20" />
                            <div className="flex-1">
                              <Label htmlFor="off" className="text-white/80 text-sm font-medium cursor-pointer">{t("settings.off")}</Label>
                              <p className="text-xs text-white/30 mt-0.5">{t("settings.offDesc")}</p>
                            </div>
                            <Badge className="bg-red-500/20 text-red-400 border-0 text-[10px]">{t("safety.restricted")}</Badge>
                          </div>
                        </RadioGroup>
                      </div>

                      <Separator className="bg-white/10" />

                      {/* Mature content toggles */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white/70 text-sm">{t("settings.showAdultContent")}</Label>
                            <p className="text-xs text-white/30 mt-0.5">{t("settings.showAdultContentDesc")}</p>
                          </div>
                          <Switch
                            checked={settings.showMatureContent === true}
                            onCheckedChange={(v) => handleUpdateSetting("showMatureContent", v)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white/70 text-sm">{t("settings.showRestrictedContent")}</Label>
                            <p className="text-xs text-white/30 mt-0.5">{t("settings.showRestrictedContentDesc")}</p>
                          </div>
                          <Switch
                            checked={settings.showRestrictedContent === true}
                            onCheckedChange={(v) => handleUpdateSetting("showRestrictedContent", v)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white/70 text-sm">{t("settings.allowMatureUploads")}</Label>
                            <p className="text-xs text-white/30 mt-0.5">{t("settings.allowMatureUploadsDesc")}</p>
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
                          {t("settings.adultContentWarning")}
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
                      <CardTitle className="text-white text-lg">{t("settings.notificationsTitle")}</CardTitle>
                      <CardDescription className="text-white/40">{t("settings.notificationsDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-white/30" />
                          <div>
                            <Label className="text-white/70 text-sm">{t("settings.emailNotifications")}</Label>
                            <p className="text-xs text-white/30">{t("settings.emailNotificationsDesc")}</p>
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
                            <Label className="text-white/70 text-sm">{t("settings.notifyFavorites")}</Label>
                            <p className="text-xs text-white/30">{t("settings.notifyFavoritesDesc")}</p>
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
                            <Label className="text-white/70 text-sm">{t("settings.notifyComments")}</Label>
                            <p className="text-xs text-white/30">{t("settings.notifyCommentsDesc")}</p>
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
                            <Label className="text-white/70 text-sm">{t("settings.notifyFollows")}</Label>
                            <p className="text-xs text-white/30">{t("settings.notifyFollowsDesc")}</p>
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
                            <Label className="text-white/70 text-sm">{t("settings.notifyGroupInvites")}</Label>
                            <p className="text-xs text-white/30">{t("settings.notifyGroupInvitesDesc")}</p>
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
                            <Label className="text-white/70 text-sm">{t("settings.notifyMessages")}</Label>
                            <p className="text-xs text-white/30">{t("settings.notifyMessagesDesc")}</p>
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
                      <CardTitle className="text-white text-lg">{t("settings.appearanceTitle")}</CardTitle>
                      <CardDescription className="text-white/40">{t("settings.appearanceDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-white/70 text-sm">{t("settings.theme")}</Label>
                        <div className="flex gap-3">
                          {[
                            { value: "dark", label: t("settings.dark"), color: "bg-[#0d0d0d]" },
                            { value: "light", label: t("settings.light"), color: "bg-[#f3f5f6]" },
                            { value: "system", label: t("settings.system"), color: "bg-gradient-to-br from-[#0d0d0d] to-[#f3f5f6]" },
                          ].map((themeOpt) => (
                            <button
                              key={themeOpt.value}
                              className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                                theme === themeOpt.value
                                  ? "border-[#0063dc] bg-[#0063dc]/5"
                                  : "border-white/10 hover:border-white/20"
                              }`}
                              onClick={() => setTheme(themeOpt.value)}
                            >
                              <div className={`w-12 h-8 rounded ${themeOpt.color} border border-white/10`} />
                              <span className="text-xs text-white/60">{themeOpt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-white/70 text-sm">{t("settings.defaultView")}</Label>
                        <Select
                          value={settings.defaultView || "grid"}
                          onValueChange={(v) => handleUpdateSetting("defaultView", v)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2a2a2d] border-white/10">
                            <SelectItem value="grid">{t("settings.gridView")}</SelectItem>
                            <SelectItem value="list">{t("settings.listView")}</SelectItem>
                            <SelectItem value="justified">{t("settings.justifiedView")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-white/70 text-sm">{t("common.language")}</Label>
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
                      <CardTitle className="text-white text-lg">{t("settings.exifTitle")}</CardTitle>
                      <CardDescription className="text-white/40">{t("settings.exifDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white/70 text-sm">{t("settings.showExif")}</Label>
                          <p className="text-xs text-white/30 mt-0.5">{t("settings.showExifDesc")}</p>
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
                      <CardTitle className="text-white text-lg">{t("settings.changePassword")}</CardTitle>
                      <CardDescription className="text-white/40">{t("settings.changePasswordDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white/60 text-sm">{t("settings.currentPassword")}</Label>
                        <Input
                          type="password"
                          value={passwordData.current}
                          onChange={(e) => setPasswordData((p) => ({ ...p, current: e.target.value }))}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60 text-sm">{t("settings.newPassword")}</Label>
                        <Input
                          type="password"
                          value={passwordData.new}
                          onChange={(e) => setPasswordData((p) => ({ ...p, new: e.target.value }))}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60 text-sm">{t("settings.confirmNewPassword")}</Label>
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
                            toast.error(t("settings.passwordMismatch"));
                            return;
                          }
                          toast.success(t("settings.passwordUpdated"));
                          setPasswordData({ current: "", new: "", confirm: "" });
                        }}
                        className="bg-[#0063dc] hover:bg-[#0052b5] text-white"
                      >
                        {t("settings.updatePassword")}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-500/5 border-red-500/10">
                    <CardHeader>
                      <CardTitle className="text-red-400 text-lg flex items-center gap-2">
                        <Trash2 className="h-5 w-5" /> {t("settings.deleteAccount")}
                      </CardTitle>
                      <CardDescription className="text-white/40">
                        {t("settings.deleteAccountDesc")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="gap-1.5">
                            <Trash2 className="h-4 w-4" /> {t("settings.deleteMyAccount")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#2a2a2d] border-white/10">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">{t("settings.areYouSure")}</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/50">
                              {t("settings.deleteWarning")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/10 text-white/70">{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-500 hover:bg-red-600 text-white">
                              {t("settings.yesDeleteAccount")}
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
        <span className="ml-1">&mdash; {t("home.footerShort")}</span>
      </footer>
    </div>
  );
}
