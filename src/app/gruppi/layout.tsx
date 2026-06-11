import type { Metadata } from "next";

const BASE_URL = "https://my-project-ten-psi-39.vercel.app";

export const metadata: Metadata = {
  title: "Groups — Join Photography Communities",
  description:
    "Join photography groups on Memoro. Connect with photographers who share your interests, participate in discussions, and share your best work with communities.",
  alternates: {
    canonical: `${BASE_URL}/gruppi`,
  },
  openGraph: {
    title: "Groups — Join Photography Communities | Memoro",
    description:
      "Join photography groups on Memoro. Connect with photographers who share your interests.",
    url: `${BASE_URL}/gruppi`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Groups — Join Photography Communities | Memoro",
    description:
      "Join photography groups on Memoro. Connect with photographers who share your interests.",
  },
};

export default function GruppiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
