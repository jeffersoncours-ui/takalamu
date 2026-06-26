import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header
        className="sticky top-0 z-30 bg-white border-b"
        style={{ borderColor: "#E9E3D8" }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.png"
              alt=""
              style={{ height: 38, width: "auto" }}
            />
            <img
              src="/wordmark.png"
              alt="كلموا"
              className="hidden sm:block"
              style={{ height: 28, width: "auto" }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            <NavLink href="/offres">Tarifs</NavLink>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/essai"
              className="hidden sm:flex rounded-full font-semibold text-white text-sm"
              style={{ background: "#0F9D6E", padding: "9px 18px", boxShadow: "0 4px 12px rgba(15,157,110,.28)" }}
            >
              Essai gratuit
            </Link>
            <Link
              href="/login"
              className="rounded-full font-semibold text-sm border"
              style={{ padding: "8px 16px", color: "#1C1A17", borderColor: "#D8D1C4", background: "#fff" }}
            >
              Mon espace
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer
        className="border-t py-8 px-4"
        style={{ borderColor: "#E9E3D8", background: "#F7F4EE" }}
      >
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt=""
              style={{ height: 30, width: "auto" }}
            />
            <img
              src="/wordmark.png"
              alt="كلموا"
              style={{ height: 22, width: "auto" }}
            />
          </div>
          <nav className="flex items-center gap-5 flex-wrap justify-center">
            <FooterLink href="/offres">Tarifs</FooterLink>
            <FooterLink href="/essai">Cours d&apos;essai</FooterLink>
            <FooterLink href="/login">Mon espace</FooterLink>
          </nav>
          <p className="text-xs" style={{ color: "#8B857A" }}>
            © {new Date().getFullYear()} Takalamu
          </p>
        </div>
      </footer>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#F0EBE2]"
      style={{ color: "#4A463F" }}
    >
      {children}
    </Link>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm" style={{ color: "#8B857A" }}>
      {children}
    </Link>
  );
}
