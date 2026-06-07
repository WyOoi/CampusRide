"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CarFront,
  ClipboardList,
  Plus,
  Search,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useSessionStore } from "@/store/session-store";
import { mockNotifications } from "@/data/mock-notifications";
import { PageHeader } from "@/components/common/page-header";
import { MotionCard } from "@/components/common/motion-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRelative } from "@/utils/format";
import type { UserRole } from "@/types";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { useRouter } from "next/navigation";


export default function DashboardPage() {
  const { activeRole, setActiveRole } = useSessionStore();
  const recentNotes = mockNotifications.slice(0, 4);
  const router = useRouter();
const handleLogout = async () => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("isAdmin");
  }
  await supabase.auth.signOut();
  router.push("/login");
};
  const [fullName, setFullName] = useState("Student");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
useEffect(() => {
  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("AUTH USER:", user);

    if (!user) {
      if (typeof window !== "undefined" && sessionStorage.getItem("isAdmin") === "true") {
        setFullName("Admin User");
        setEmail("admin");
        setRole("Admin");
        return;
      }
      router.push("/login");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    console.log("PROFILE:", profile);
    console.log("PROFILE ERROR:", error);

    if (profile) {
      setFullName(profile.full_name);
      setEmail(profile.email);
setRole(
  profile.role.charAt(0).toUpperCase() +
  profile.role.slice(1)
);
    }
  };

  loadUser();
}, [router]);
  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hi ${fullName.split(" ")[0]}`}
        description={`${email} • ${role}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/orders">
                <ClipboardList className="mr-2 h-4 w-4" />
                Orders
              </Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-xl">
              <Link href="/find">
                <Search className="mr-2 h-4 w-4" />
                Find ride
              </Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link href="/offer">
                <Plus className="mr-2 h-4 w-4" />
                Offer ride
              </Link>
            </Button>
          </div>
        }
      />
<Button
  variant="destructive"
  className="rounded-xl"
  onClick={handleLogout}
>
  <LogOut className="mr-2 h-4 w-4" />
  Logout
</Button>
      {role.toLowerCase() === "both" && (
        <MotionCard>
        <Card className="overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-4 w-4" />
                Role selection (Zustand)
              </div>
              <p className="text-lg font-semibold tracking-tight">How are you commuting today?</p>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Switch modes to tailor quick actions. This is local UI state only — wire it to your auth service later.
              </p>
              <Tabs
                value={activeRole === "both" ? "passenger" : activeRole}
                onValueChange={(v) => setActiveRole(v as UserRole)}
                className="w-full max-w-md"
              >
                <TabsList className="grid w-full grid-cols-2 rounded-xl">
                  <TabsTrigger value="passenger" className="rounded-lg">
                    Passenger
                  </TabsTrigger>
                  <TabsTrigger value="driver" className="rounded-lg">
                    Driver
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-4 shadow-sm"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <CarFront className="h-6 w-6" />
              </div>
              <div className="text-sm">
                <p className="font-semibold">{activeRole === "driver" ? "Driver mode" : "Passenger mode"}</p>
                <p className="text-muted-foreground">
                  {activeRole === "driver"
                    ? "You’ll see offer-first CTAs and vehicle reminders."
                    : "You’ll see match-first CTAs and seat guarantees (mock)."}
                </p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
        </MotionCard>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ride activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-semibold">42</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cancelled</span>
              <span className="font-semibold">3</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">No-shows</span>
              <span className="font-semibold">0</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Notifications</CardTitle>
            <Badge variant="outline" className="rounded-full">
              {recentNotes.filter((n) => !n.read).length} new
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentNotes.map((n) => (
              <div key={n.id} className="rounded-2xl border border-border bg-muted/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <span className="text-[11px] text-muted-foreground">{formatRelative(n.timeISO)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
              </div>
            ))}
            <Button asChild variant="secondary" className="w-full rounded-xl">
              <Link href="/notifications">Open notification center</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
