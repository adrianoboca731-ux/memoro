import type { Metadata } from "next";

const BASE_URL = "https://my-project-ten-psi-39.vercel.app";

export const metadata: Metadata = {
  title: "Sign Up — Join Memoro for Free",
  description:
    "Create your free Memoro account today. Upload unlimited photos, create galleries, join photography groups, and share your work with the world.",
  alternates: {
    canonical: `${BASE_URL}/auth/registrati`,
  },
  openGraph: {
    title: "Sign Up — Join Memoro for Free",
    description: "Create your free Memoro account. Upload unlimited photos, create galleries, and connect with photographers.",
    url: `${BASE_URL}/auth/registrati`,
    type: "website",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegistratiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
