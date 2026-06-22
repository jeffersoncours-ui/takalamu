"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Cours" },
  { href: "/dashboard/vocabulary", label: "Vocabulaire" },
  { href: "/dashboard/grammar", label: "Grammaire" },
  { href: "/dashboard/homework", label: "Devoirs" },
];

export default function DashboardTabs() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 pb-0">
      {TABS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
