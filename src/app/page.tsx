import { redirect } from "next/navigation";

// Plateforme fermée au public (bouche-à-oreille) — la racine mène directement
// à la connexion.
export default function HomePage() {
  redirect("/login");
}
