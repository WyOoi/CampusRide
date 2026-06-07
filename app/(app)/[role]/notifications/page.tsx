"use client";

import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRelative } from "@/utils/format";

export default function NotificationsPage() {
  console.log("🔥 NOTIFICATIONS PAGE LOADED 🔥");

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


useEffect(() => {
  const loadAlerts = async () => {
    console.log("Loading alerts...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("USER:", user);

    if (!user) {
      setLoading(false);
      return;
    }
const { error: readError } = await supabase
  .from("alerts")
  .update({ is_read: true })
  .eq("user_id", user.id)
  .eq("is_read", false);

console.log("MARK READ ERROR:", readError);

window.dispatchEvent(
  new CustomEvent("notifications-read")
);
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    console.log("ALERTS:", data);
    console.log("ERROR:", error);

    if (error) {
      console.error(error);
    } else {
      setAlerts(data || []);
    }

    setLoading(false);
  };

  loadAlerts();
  const channel = supabase
  .channel("alerts-realtime")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "alerts",
    },
(payload) => {
  console.log("NEW ALERT:", payload);



  setAlerts((prev) => [
    payload.new as any,
    ...prev,
  ]);
}
  )
  .subscribe();
  return () => {
  supabase.removeChannel(channel);
};
}, []);

if (loading) {
  return (
    <div className="p-6">
      <p>Loading notifications...</p>
    </div>
  );
}
console.log("STATE ALERTS:", alerts);
console.log("COUNT:", alerts.length);
  return (
    <div className="space-y-8">
      <PageHeader
      
        title="Notification center"
        description="Ride alerts, booking confirmations, and a lightweight activity feed."
      />

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 rounded-xl sm:grid-cols-4">
          <TabsTrigger value="all" className="rounded-lg">
            All
          </TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-lg">
            Ride alerts
          </TabsTrigger>
          <TabsTrigger value="bookings" className="rounded-lg">
            Bookings
          </TabsTrigger>
          <TabsTrigger value="feed" className="rounded-lg">
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {alerts.length === 0 ? (
  <div className="p-6 text-center text-muted-foreground">
    No notifications yet.
  </div>
) : (
  alerts.map((n) => (
                <div key={n.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{n.title}</p>
                      {!n.is_read ? (
                        <Badge className="rounded-full" variant="default">
                          New
                        </Badge>
                      ) : null}

                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatRelative(n.created_at)}</p>
                </div>
              )))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardContent className="space-y-4 p-4">
              {alerts.length === 0 ? (
  <div className="p-6 text-center text-muted-foreground">
    No notifications yet.
  </div>
) : (
  alerts.map((n) => (
                <div key={n.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="font-semibold">{n.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                </div>
              )))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardContent className="space-y-4 p-4">
              {alerts.length === 0 ? (
  <div className="p-6 text-center text-muted-foreground">
    No notifications yet.
  </div>
) : (
  alerts.map((n) => (
                <div key={n.id} className="rounded-2xl border border-border p-4">
                  <p className="font-semibold">{n.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                </div>
              )))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feed">
          <Card>
            <CardContent className="space-y-4 p-4">
              {alerts.length === 0 ? (
  <div className="p-6 text-center text-muted-foreground">
    No notifications yet.
  </div>
) : (
  alerts.map((n) => (
                <div key={n.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{n.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatRelative(n.created_at)}</span>
                  </div>
                  <Separator className="mt-4" />
                </div>
              )))}

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
