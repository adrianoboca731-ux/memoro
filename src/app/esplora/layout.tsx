import type { Metadata } from "next";

const BASE_URL = "https://my-project-ten-psi-39.vercel.app";

export const metadata: Metadata = {
  title: "Explore — Discover Amazing Photos",
  description:
    "Explore the best photos from the Memoro community. Browse trending, recent, and popular photography from creators worldwide. Find inspiration and connect with photographers.",
  alternates: {
    canonical: `${BASE_URL}/esplora`,
  },
  openGraph: {
    title: "Explore — Discover Amazing Photos | Memoro",
    description:
      "Browse trending, recent, and popular photography from creators worldwide on Memoro.",
    url: `${BASE_URL}/esplora`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore — Discover Amazing Photos | Memoro",
    description:
      "Browse trending, recent, and popular photography from creators worldwide.",
  },
};

export default function EsploraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
