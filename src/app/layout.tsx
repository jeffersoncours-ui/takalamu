import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Instrument_Sans, Amiri } from "next/font/google";
import "./globals.css";

// Variable conservée --font-spectral (des dizaines d'écrans lisent var(--font-spectral)
// directement en style inline) : seule la police chargée change, pas le nom de variable.
const spectral = Cormorant_Garamond({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Instrument_Sans({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Tatakalamu — cours d'arabe & étude de texte",
  description:
    "Plateforme de cours d'arabe individuels et d'étude de texte islamique en groupe.",
  // Nom affiché sous l'icône quand le site est ajouté à l'écran d'accueil iOS.
  appleWebApp: {
    capable: true,
    title: "Tatakalamu",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#EFE6D2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${spectral.variable} ${inter.variable} ${amiri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-page text-ink">{children}</body>
    </html>
  );
}
