import type { Metadata } from "next";

const BASE_URL = "https://my-project-ten-psi-39.vercel.app";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  try {
    const res = await fetch(`${BASE_URL}/api/users/${username}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        title: "User Not Found",
        description: "The user profile you are looking for does not exist.",
      };
    }

    const user = await res.json();
    const name = user.name || user.username || "User";
    const bio = user.bio || `${name} is on Memoro — the free photo sharing platform. Browse their photos, albums, and galleries.`;
    const avatarUrl = user.avatar;

    return {
      title: `${name} (@${user.username}) — Photographer on Memoro`,
      description: bio.slice(0, 160),
      alternates: {
        canonical: `${BASE_URL}/persone/${username}`,
      },
      openGraph: {
        title: `${name} (@${user.username}) — Photographer on Memoro`,
        description: bio.slice(0, 160),
        url: `${BASE_URL}/persone/${username}`,
        type: "profile",
        images: avatarUrl
          ? [
              {
                url: avatarUrl,
                width: 400,
                height: 400,
                alt: `${name}'s avatar`,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary",
        title: `${name} (@${user.username}) — Photographer on Memoro`,
        description: bio.slice(0, 160),
        images: avatarUrl ? [avatarUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Profile | Memoro",
      description: "View this photographer's profile on Memoro.",
    };
  }
}

export default function ProfiloLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
