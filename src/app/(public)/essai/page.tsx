import type { Metadata } from "next";
import { EssaiFunnel } from "./funnel";

export const metadata: Metadata = {
  title: "Cours d'essai gratuit — Takalamu",
  description:
    "Réserve ton cours d'essai gratuit d'arabe en visio. Choisis ton créneau directement en ligne.",
};

export default function EssaiPage() {
  return <EssaiFunnel />;
}
