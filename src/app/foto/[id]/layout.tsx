import type { Metadata } from "next";

const BASE_URL = "https://my-project-ten-psi-39.vercel.app";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${BASE_URL}/api/photos/${id}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        title: "Photo Not Found",
        description: "The photo you are looking for does not exist or has been removed.",
      };
    }

    const photo = await res.json();
    const title = photo.title || "Photo";
    const description =
      photo.description || `Photo by ${photo.user?.name || "a Memoro user"} on Memoro — the free photo sharing platform.`;
    const imageUrl = photo.thumbnail || photo.filepath;

    return {
      title: `${title} — Photo by ${photo.user?.name || "Memoro User"}`,
      description: description.slice(0, 160),
      alternates: {
        canonical: `${BASE_URL}/foto/${id}`,
      },
      openGraph: {
        title: `${title} — Photo by ${photo.user?.name || "Memoro User"}`,
        description: description.slice(0, 160),
        url: `${BASE_URL}/foto/${id}`,
        type: "article",
        images: imageUrl
          ? [
              {
                url: imageUrl,
                width: 1200,
                height: 630,
                alt: title,
              },
            ]
          : undefined,
        publishedTime: photo.createdAt,
        authors: photo.user?.name ? [photo.user.name] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} — Photo by ${photo.user?.name || "Memoro User"}`,
        description: description.slice(0, 160),
        images: imageUrl ? [imageUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Photo | Memoro",
      description: "View this photo on Memoro — the free photo sharing platform.",
    };
  }
}

export default function FotoDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
