import type { Metadata } from "next";
import { InscriptionFunnel } from "./funnel";

export const metadata: Metadata = {
  title: "Inscription — Takalamu",
  description: "Utilise ton code d'essai pour choisir ton abonnement et créer ton compte.",
};

export default function InscriptionPage() {
  return <InscriptionFunnel />;
}
