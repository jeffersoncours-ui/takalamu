"use client";

import dynamic from "next/dynamic";

const VitrineBg = dynamic(
  () => import("./vitrine-bg").then((m) => m.VitrineBg),
  { ssr: false },
);

export function VitrineBgWrapper() {
  return <VitrineBg />;
}
