import { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE_URL = "https://my-project-ten-psi-39.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/esplora`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/cerca`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/carica`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/gallerie`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/gruppi`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/auth/accedi`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/auth/registrati`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic pages from database
  try {
    // Photos
    const photos = await db.photo.findMany({
      select: { id: true, updatedAt: true },
      where: { safetyLevel: "safe" },
      take: 1000,
      orderBy: { updatedAt: "desc" },
    });

    const photoPages: MetadataRoute.Sitemap = photos.map((photo) => ({
      url: `${BASE_URL}/foto/${photo.id}`,
      lastModified: photo.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Users
    const users = await db.user.findMany({
      select: { username: true, updatedAt: true },
      where: { isPublic: true },
      take: 500,
      orderBy: { updatedAt: "desc" },
    });

    const userPages: MetadataRoute.Sitemap = users.map((user) => ({
      url: `${BASE_URL}/persone/${user.username}`,
      lastModified: user.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    // Galleries
    const galleries = await db.gallery.findMany({
      select: { id: true, updatedAt: true },
      where: { isPublic: true },
      take: 500,
      orderBy: { updatedAt: "desc" },
    });

    const galleryPages: MetadataRoute.Sitemap = galleries.map((gallery) => ({
      url: `${BASE_URL}/gallerie/${gallery.id}`,
      lastModified: gallery.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    // Groups
    const groups = await db.group.findMany({
      select: { id: true, updatedAt: true },
      where: { isPublic: true },
      take: 500,
      orderBy: { updatedAt: "desc" },
    });

    const groupPages: MetadataRoute.Sitemap = groups.map((group) => ({
      url: `${BASE_URL}/gruppi/${group.id}`,
      lastModified: group.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...photoPages, ...userPages, ...galleryPages, ...groupPages];
  } catch {
    // If database is not available, return static pages only
    return staticPages;
  }
}
