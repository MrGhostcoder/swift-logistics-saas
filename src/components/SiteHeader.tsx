import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Mail } from "lucide-react";
import { Logo, TelegramButton } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const allLinks = [
  { to: "/#features", label: "Features", hash: true },
  { to: "/pricing", label: "Pricing" },
  { to: "/track", label: "Track Package" },
];

export function SiteHeader({
  minimal = false,
  bare = false,
}: {
  minimal?: boolean;
  bare?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const links = bare ? [] : minimal ? allLinks.filter((l) => l.label === "Track Package") : allLinks;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        {!bare && (
          <nav className="hidden items-center gap-1 md:flex">
            {!minimal && <TelegramButton className="mr-2" />}
            {links.map((l) =>
              l.hash ? (
                <a
                  key={l.label}
                  href={l.to}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  to={l.to}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {l.label}
                </Link>
              ),
            )}
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={signOut}>
                  Log Out
                </Button>
              </>
            ) : minimal ? null : (
              <>
                <Link to="/login">
                  <Button size="sm" variant="ghost">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </nav>
        )}
        {!bare && (
          <button
            className="rounded-lg border border-border p-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}
      </div>
      {!bare && open && (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {!minimal && <TelegramButton className="w-full" />}
            {links.map((l) =>
              l.hash ? (
                <a
                  key={l.label}
                  href={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium"
                >
                  {l.label}
                </Link>
              ),
            )}
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)}>
                  <Button className="w-full">Dashboard</Button>
                </Link>
                <Button variant="outline" className="w-full" onClick={signOut}>
                  Log Out
                </Button>
              </>
            ) : minimal ? null : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

const footerCols = [
  {
    title: "Product",
    links: [
      { to: "/#features", label: "Features", hash: true },
      { to: "/track", label: "Track Package" },
    ],
  },
  {
    title: "Account",
    links: [
      { to: "/login", label: "Login" },
      { to: "/signup", label: "Sign Up" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Real-time shipment tracking, public tracking links and delivery notifications — all in one place.
            </p>
          </div>
          {footerCols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.hash ? (
                      <a
                        href={l.to}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        to={l.to}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">Need help?</h4>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Join our community or message support — we reply fast.
            </p>
            <a
              href="mailto:swifttracking@solobrandin.com"
              className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <Mail className="h-4 w-4" />
              swifttracking@solobrandin.com
            </a>
            <div className="mt-4">
              <TelegramButton className="w-full sm:w-auto" />
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SwiftTrack Logistics. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Shipment tracking made simple.</p>
        </div>
      </div>
    </footer>
  );
}
