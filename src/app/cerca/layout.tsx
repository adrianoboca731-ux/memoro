import type { Metadata } from "next";

const BASE_URL = "https://my-project-ten-psi-39.vercel.app";

export const metadata: Metadata = {
  title: "Search — Find Photos, People & Groups",
  description:
    "Search for photos, photographers, and groups on Memoro. Find exactly what you're looking for across millions of shared images and creative communities.",
  alternates: {
    canonical: `${BASE_URL}/cerca`,
  },
  openGraph: {
    title: "Search — Find Photos, People & Groups | Memoro",
    description:
      "Search for photos, photographers, and groups on Memoro. Find exactly what you're looking for.",
    url: `${BASE_URL}/cerca`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Search — Find Photos, People & Groups | Memoro",
    description:
      "Search for photos, photographers, and groups on Memoro.",
  },
};

export default function CercaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
