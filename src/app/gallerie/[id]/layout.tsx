import type { Metadata } from "next";

const BASE_URL = "https://my-project-ten-psi-39.vercel.app";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${BASE_URL}/api/galleries/${id}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        title: "Gallery Not Found",
        description: "The gallery you are looking for does not exist.",
      };
    }

    const gallery = await res.json();
    const name = gallery.name || "Gallery";
    const description =
      gallery.description || `${name} — A curated photo gallery on Memoro, the free photo sharing platform.`;
    const coverUrl = gallery.cover;

    return {
      title: `${name} — Gallery on Memoro`,
      description: description.slice(0, 160),
      alternates: {
        canonical: `${BASE_URL}/gallerie/${id}`,
      },
      openGraph: {
        title: `${name} — Gallery on Memoro`,
        description: description.slice(0, 160),
        url: `${BASE_URL}/gallerie/${id}`,
        type: "article",
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
        title: `${name} — Gallery on Memoro`,
        description: description.slice(0, 160),
        images: coverUrl ? [coverUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Gallery | Memoro",
      description: "View this photo gallery on Memoro.",
    };
  }
}

export default function GalleriaDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
