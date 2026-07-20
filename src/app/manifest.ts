import type { MetadataRoute } from "next";

/**
 * Manifest PWA — permet l'ajout du site à l'écran d'accueil (Android surtout)
 * avec le bon nom et la bonne icône. Sur iOS, l'icône vient d'apple-icon.png
 * et le nom de `appleWebApp.title` (voir layout.tsx).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tatakalamu — cours d'arabe & étude de texte",
    short_name: "Tatakalamu",
    description:
      "Plateforme de cours d'arabe individuels et d'étude de texte islamique en groupe.",
    start_url: "/",
    display: "standalone",
    background_color: "#EFE6D2",
    theme_color: "#EFE6D2",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
