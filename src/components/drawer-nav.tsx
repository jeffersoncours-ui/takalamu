"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/teacher",
    label: "Cockpit",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/teacher/students",
    label: "Mes élèves",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/teacher/homework",
    label: "File de correction",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <polyline points="9 15 12 18 17 13" />
      </svg>
    ),
  },
  {
    href: "/teacher/session/new",
    label: "Fin de cours",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "/teacher/library",
    label: "Bibliothèque",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
  },
  {
    href: "/teacher/books",
    label: "Mes livres",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    href: "/teacher/messages",
    label: "Messages",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/teacher/admin/teachers",
    label: "Enseignants",
    adminOnly: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
  {
    href: "/teacher/profile",
    label: "Mon profil",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

type Props = {
  profileName: string;
  signOutAction: () => Promise<void>;
  isAdmin?: boolean;
  avatarUrl?: string | null;
};

export function DrawerNav({ profileName, signOutAction, isAdmin = false, avatarUrl = null }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const currentLabel =
    navItems.find((item) =>
      item.href === "/teacher"
        ? pathname === "/teacher"
        : pathname.startsWith(item.href),
    )?.label ?? "Takalamu";

  return (
    <>
      {/* Burger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="flex items-center justify-center rounded-xl bg-white transition-opacity hover:opacity-75"
        style={{ width: 44, height: 44, boxShadow: "0 6px 16px rgba(28,26,23,.04)", border: "1px solid #E9E3D8" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1A17" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Page title */}
      <span
        className="font-semibold text-xl"
        style={{ color: "#1C1A17", fontFamily: "var(--font-spectral)" }}
      >
        {currentLabel}
      </span>

      {/* Scrim */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(28,26,23,.45)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 left-0 z-50 flex flex-col"
        style={{
          width: "82vw",
          maxWidth: "340px",
          background: "#0A4636",
          borderRadius: "0 28px 28px 0",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .28s cubic-bezier(.22,1,.36,1)",
        }}
      >
        {/* Profil */}
        <div className="px-6 pt-12 pb-6" style={{ borderBottom: "1px solid rgba(255,255,255,.1)" }}>
          <div
            className="flex items-center justify-center overflow-hidden rounded-full text-white font-semibold text-xl mb-3"
            style={{ width: 56, height: 56, background: "rgba(255,255,255,.15)", fontFamily: "var(--font-spectral)" }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              profileName?.[0]?.toUpperCase() ?? "?"
            )}
          </div>
          <p className="text-white font-semibold text-base" style={{ fontFamily: "var(--font-spectral)" }}>
            {profileName}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "#9FE3C8" }}>Enseignant · Arabe</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p
            className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#6B9E8A", letterSpacing: ".07em", fontSize: "10px" }}
          >
            Mon espace
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active =
                item.href === "/teacher"
                  ? pathname === "/teacher"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                    style={{
                      background: active ? "rgba(255,255,255,.14)" : "transparent",
                      color: active ? "#FFFFFF" : "#DCEFE7",
                    }}
                  >
                    <span style={{ color: active ? "#FFFFFF" : "#9FE3C8" }}>{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Déconnexion */}
        <div className="px-3 pb-8 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-white/10"
              style={{ color: "#F5A9AB" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
