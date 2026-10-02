import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Gift, MapPin, ShieldCheck, Zap } from "lucide-react";
import { Logo } from "@/components/brand";

const perks = [
  { icon: Gift, text: "1 free tracking code for every new account" },
  { icon: MapPin, text: "Live timeline and route map for each package" },
  { icon: Zap, text: "Instant status updates for your customers" },
  { icon: ShieldCheck, text: "Secure sign-in with Google or email" },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary/15 via-background to-accent/40 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <Link to="/">
          <Logo />
        </Link>
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight">
            Ship smarter.
            <br />
            <span className="text-primary">Track everything.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} SwiftTrack Logistics
        </p>
      </aside>
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function FreeTrackingBadge() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Gift className="h-4 w-4" />
      </span>
      <span>
        <strong>1 free tracking code</strong> included when you create your account.
      </span>
    </div>
  );
}
