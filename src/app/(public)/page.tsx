import { redirect } from "next/navigation";

// Plateforme fermée au public (bouche-à-oreille) — la racine mène directement
// à la connexion. Vitrine (/offres, /essai, /inscription) conservée mais
// dormante, accessible par URL directe uniquement.
export default function HomePage() {
  redirect("/login");
}
