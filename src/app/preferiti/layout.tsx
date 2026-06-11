import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favorites",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PreferitiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
