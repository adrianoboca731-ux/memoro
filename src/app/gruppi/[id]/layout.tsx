import type { Metadata } from "next";

const BASE_URL = "https://my-project-ten-psi-39.vercel.app";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${BASE_URL}/api/groups/${id}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        title: "Group Not Found",
        description: "The group you are looking for does not exist.",
      };
    }

    const group = await res.json();
    const name = group.name || "Group";
    const description =
      group.description || `${name} — A photography group on Memoro. Join the community and share your photos.`;
    const coverUrl = group.cover;

    return {
      title: `${name} — Photography Group on Memoro`,
      description: description.slice(0, 160),
      alternates: {
        canonical: `${BASE_URL}/gruppi/${id}`,
      },
      openGraph: {
        title: `${name} — Photography Group on Memoro`,
        description: description.slice(0, 160),
        url: `${BASE_URL}/gruppi/${id}`,
        type: "website",
        images: coverUrl
          ? [
              {
                url: coverUrl,
                width: 1200,
                height: 630,
                alt: name,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} — Photography Group on Memoro`,
        description: description.slice(0, 160),
        images: coverUrl ? [coverUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Group | Memoro",
      description: "View this photography group on Memoro.",
    };
  }
}

export default function GruppoDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
