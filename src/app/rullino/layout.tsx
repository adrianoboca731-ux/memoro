import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Camera Roll",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RullinoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
