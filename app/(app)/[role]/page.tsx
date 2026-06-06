"use client";

import { useParams } from "next/navigation";
import DashboardPage from "./dashboard-page-content";
import AdminDashboardPage from "./admin-page-content";

export default function RoleDashboardPage() {
  const params = useParams<{ role: string }>();

  if (params.role === "admin") {
    return <AdminDashboardPage />;
  }

  return <DashboardPage />;
}
