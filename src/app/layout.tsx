import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { I18nProvider } from "@/lib/i18n";
import { HtmlLang } from "@/components/html-lang";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Memoro — Share Your Memories | Free Photo Sharing Platform",
    template: "%s | Memoro",
  },
  description:
    "Memoro is the free platform for sharing and discovering extraordinary photos. Upload unlimited photos, create galleries, join groups, and connect with photographers worldwide.",
  keywords: [
    "photo sharing", "free photo hosting", "photography community", "photo gallery",
    "upload photos", "share photos", "photography", "photo albums", "free image hosting",
    "memoro", "photo community", "photographers", "creative photos",
  ],
  authors: [{ name: "Memoro" }],
  creator: "Memoro",
  publisher: "Memoro",
  metadataBase: new URL("https://my-project-ten-psi-39.vercel.app"),
  alternates: {
    canonical: "https://my-project-ten-psi-39.vercel.app",
    languages: {
      "it": "https://my-project-ten-psi-39.vercel.app",
      "en": "https://my-project-ten-psi-39.vercel.app",
      "fr": "https://my-project-ten-psi-39.vercel.app",
      "de": "https://my-project-ten-psi-39.vercel.app",
      "es": "https://my-project-ten-psi-39.vercel.app",
      "pt-BR": "https://my-project-ten-psi-39.vercel.app",
      "ja": "https://my-project-ten-psi-39.vercel.app",
      "ko": "https://my-project-ten-psi-39.vercel.app",
      "zh-TW": "https://my-project-ten-psi-39.vercel.app",
      "zh-CN": "https://my-project-ten-psi-39.vercel.app",
    },
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    alternateLocale: ["en_US", "fr_FR", "de_DE", "es_ES", "pt_BR", "ja_JP", "ko_KR", "zh_TW", "zh_CN"],
    url: "https://my-project-ten-psi-39.vercel.app",
    siteName: "Memoro",
    title: "Memoro — Share Your Memories | Free Photo Sharing Platform",
    description: "The free platform for sharing and discovering extraordinary photos. Upload unlimited photos, create galleries, and connect with photographers.",
    images: [
      {
        url: "https://res.cloudinary.com/dmp9v6pfo/image/upload/w_1200,h_630,c_fill,q_auto:good,f_auto/memoro/og-image",
        width: 1200,
        height: 630,
        alt: "Memoro — Free Photo Sharing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Memoro — Share Your Memories",
    description: "The free platform for sharing and discovering extraordinary photos.",
    images: ["https://res.cloudinary.com/dmp9v6pfo/image/upload/w_1200,h_630,c_fill,q_auto:good,f_auto/memoro/og-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "memoro-verification",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // JSON-LD Structured Data for search engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Memoro",
    url: "https://my-project-ten-psi-39.vercel.app",
    description: "The free platform for sharing and discovering extraordinary photos. Upload unlimited photos, create galleries, and connect with photographers worldwide.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://my-project-ten-psi-39.vercel.app/cerca?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    sameAs: [],
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Memoro",
    url: "https://my-project-ten-psi-39.vercel.app",
    logo: "https://res.cloudinary.com/dmp9v6pfo/image/upload/w_200,h_200,c_fill,q_auto:good,f_auto/memoro/logo",
    description: "Free photo sharing platform",
  };

  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <AuthProvider>
          <I18nProvider>
            <HtmlLang />
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
