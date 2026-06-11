import type { Metadata } from "next";

const BASE_URL = "https://my-project-ten-psi-39.vercel.app";

export const metadata: Metadata = {
  title: "Galleries — Curate Your Best Photos",
  description:
    "Create and manage photo galleries on Memoro. Organize your best shots into beautiful curated collections and share them with the world.",
  alternates: {
    canonical: `${BASE_URL}/gallerie`,
  },
  openGraph: {
    title: "Galleries — Curate Your Best Photos | Memoro",
    description:
      "Create and manage photo galleries on Memoro. Organize your best shots into beautiful curated collections.",
    url: `${BASE_URL}/gallerie`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Galleries — Curate Your Best Photos | Memoro",
    description:
      "Create and manage photo galleries on Memoro.",
  },
};

export default function GallerieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
