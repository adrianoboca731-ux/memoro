import type { Metadata } from "next";

const BASE_URL = "https://my-project-ten-psi-39.vercel.app";

export const metadata: Metadata = {
  title: "Albums — Organize Your Photos",
  description:
    "Create and manage photo albums on Memoro. Organize your photos into collections and share them with the community.",
  alternates: {
    canonical: `${BASE_URL}/album`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function AlbumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
