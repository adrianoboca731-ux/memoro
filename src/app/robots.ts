import { MetadataRoute } from "next";

const BASE_URL = "https://my-project-ten-psi-39.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/impostazioni",
          "/messaggi",
          "/notifiche",
          "/preferiti",
          "/rullino",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
