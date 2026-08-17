import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState, Skeletons } from "@/components/brand";
import { useIsAdmin } from "@/hooks/useAuth";

const nav = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/payments", label: "Payments" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/tracking", label: "Tracking Codes" },
  { to: "/admin/settings", label: "Settings" },
];

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAdmin === false) {
      const t = setTimeout(() => navigate({ to: "/dashboard", replace: true }), 1200);
      return () => clearTimeout(t);
    }
  }, [isAdmin, isLoading, navigate]);

  return (
    <DashboardShell nav={isAdmin ? nav : []}>
      {isLoading ? (
        <Skeletons rows={4} />
      ) : isAdmin ? (
        <Outlet />
      ) : (
        <EmptyState
          icon={ShieldAlert}
          title="Admin access required"
          description="You don't have permission to view this area. Redirecting to your dashboard…"
        />
      )}
    </DashboardShell>
  );
}
