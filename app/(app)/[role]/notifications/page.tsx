"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRelative } from "@/utils/format";

export default function NotificationsPage() {
  console.log("🔥 NOTIFICATIONS PAGE LOADED 🔥");

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { error: readError } = await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    window.dispatchEvent(new CustomEvent("notifications-read"));

    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setAlerts(data || []);
    }

    setLoading(false);

    const channel = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setAlerts((prev) => [payload.new as any, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const cleanupPromise = loadAlerts();
  return () => {
    cleanupPromise.then((cleanup) => {
      if (cleanup) cleanup();
    });
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

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            alerts.map((n) => (
              <div key={n.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors">
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
                <p className="text-xs text-muted-foreground sm:whitespace-nowrap">{formatRelative(n.created_at)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
