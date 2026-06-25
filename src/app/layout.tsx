import type { Metadata } from "next";
import { Spectral, Plus_Jakarta_Sans, Amiri, Barlow } from "next/font/google";
import "./globals.css";

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Takalamu — cours d'arabe & étude de texte",
  description:
    "Plateforme de cours d'arabe individuels et d'étude de texte islamique en groupe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${spectral.variable} ${barlow.variable} ${plusJakarta.variable} ${amiri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-page text-ink">{children}</body>
    </html>
  );
}
