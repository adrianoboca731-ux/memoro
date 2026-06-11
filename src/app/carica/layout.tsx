import type { Metadata } from "next";

const BASE_URL = "https://my-project-ten-psi-39.vercel.app";

export const metadata: Metadata = {
  title: "Upload — Share Your Photos",
  description:
    "Upload your photos to Memoro. Share your best shots with the world, add tags, and organize them into albums and galleries.",
  alternates: {
    canonical: `${BASE_URL}/carica`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function CaricaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
