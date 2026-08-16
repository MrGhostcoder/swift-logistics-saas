import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { SupportButton } from "@/components/brand";

const nav = [
  { to: "/dashboard", label: "Overview" },
  { to: "/dashboard/tracking", label: "Tracking Codes" },
  { to: "/dashboard/payments", label: "Payments" },
  { to: "/dashboard/messages", label: "Messages" },
  { to: "/dashboard/notifications", label: "Notifications" },
  { to: "/dashboard/settings", label: "Settings" },
];

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: () => (
    <>
      <DashboardShell nav={nav}>
        <Outlet />
      </DashboardShell>
      <SupportButton />
    </>
  ),
});
