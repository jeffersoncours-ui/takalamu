import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Le plafond par défaut d'un server action est 1 Mo → une photo de téléphone
      // faisait planter la fiche de fin de cours (supports) avant d'exécuter le code.
      // Relevé ici pour lever ce blocage. (Le dépôt de devoir côté élève, lui, uploade
      // en direct navigateur → Storage et ne dépend plus du tout de cette limite.)
      // NB : Vercel plafonne de son côté le corps d'une requête serverless à ~4,5 Mo.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
