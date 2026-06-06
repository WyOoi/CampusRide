import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
