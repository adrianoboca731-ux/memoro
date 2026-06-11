import type { Metadata } from "next";

const BASE_URL = "https://my-project-ten-psi-39.vercel.app";

export const metadata: Metadata = {
  title: "Sign In — Access Your Memoro Account",
  description:
    "Sign in to your Memoro account to share photos, join groups, and connect with photographers worldwide.",
  alternates: {
    canonical: `${BASE_URL}/auth/accedi`,
  },
  openGraph: {
    title: "Sign In — Memoro",
    description: "Sign in to your Memoro account to share photos and connect with photographers.",
    url: `${BASE_URL}/auth/accedi`,
    type: "website",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function AccediLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
