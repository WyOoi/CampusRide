"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/empty-state";
import { Search, ClipboardList, History as HistoryIcon, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RequestsPage() {
  const params = useParams<{ role: string }>();
  const role = params.role;
  const router = useRouter();

  useEffect(() => {
    if (role === "passenger") {
      router.replace("/passenger/orders");
    }
  }, [role, router]);

  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Passenger state
  const [activeRequests, setActiveRequests] = useState<any[]>([]);
  const [pastRequests, setPastRequests] = useState<any[]>([]);

  const initialize = async () => {
    if (role === "passenger") return;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;
    setUserId(user.id);

    loadRequests(user.id);
  };

  useEffect(() => {
    initialize();

    const interval = setInterval(() => {
      if (userId) {
        loadRequests(userId);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [role, userId]);

  const loadRequests = async (currentUserId: string) => {
    try {
      if (role === "passenger") return;
      if (role === "driver") {
        const { data, error } = await supabase
          .from("ride_requests")
          .select("*")
          .eq("status", "open")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setRequests(data || []);
      } else if (role === "passenger") {
        // Load passenger active requests
        const { data: activeData, error: activeErr } = await supabase
          .from("ride_requests")
          .select("*")
          .eq("passenger_id", currentUserId)
          .in("status", ["open", "accepted"])
          .order("departure_time", { ascending: true });

        if (activeErr) throw activeErr;
        setActiveRequests(activeData || []);

        // Load passenger past requests
        const { data: pastData, error: pastErr } = await supabase
          .from("ride_requests")
          .select("*")
          .eq("passenger_id", currentUserId)
          .in("status", ["completed", "cancelled"])
          .order("created_at", { ascending: false });

        if (pastErr) throw pastErr;
        setPastRequests(pastData || []);
      }
    } catch (error: any) {
      console.error("Error loading requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (request: any) => {
    try {
      if (!userId) {
        toast.error("Please login");
        return;
      }

      if (request.status !== "open") {
        toast.error("Request already accepted");
        return;
      }

      if (userId === request.passenger_id) {
        toast.error("You cannot accept your own ride request");
        return;
      }

      const { data, error } = await supabase
        .from("ride_requests")
        .update({
          status: "accepted",
          accepted_driver_id: userId,
        })
        .eq("id", request.id)
        .select();

      if (error) throw error;

      await supabase.from("alerts").insert({
        user_id: request.passenger_id,
        title: "Ride Request Accepted",
        message: "A driver has accepted your ride request.",
      });

      toast.success("Ride request accepted");
      loadRequests(userId);
    } catch (error: any) {
      toast.error(error?.message || "Unknown error");
    }
  };

  const cancelRequestByPassenger = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("ride_requests")
        .update({ status: "cancelled" })
        .eq("id", requestId);

      if (error) throw error;
      toast.success("Ride request cancelled");
      if (userId) loadRequests(userId);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel request");
    }
  };

  if (role === "passenger") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground animate-pulse">Redirecting to orders...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground animate-pulse">Loading requests...</p>
      </div>
    );
  }

  // Passenger Render
  if (role === "passenger") {
    const hasNoRequests = activeRequests.length === 0 && pastRequests.length === 0;

    if (hasNoRequests) {
      return (
        <div className="space-y-8">
          <PageHeader title="My Requests" description="Manage your submitted ride requests." />
          <EmptyState
            icon={ClipboardList}
            title="No requests yet"
            description="Request a ride and it will appear here."
            action={{
              label: "Request a ride",
              href: "/passenger/request-ride",
            }}
          />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title="My Requests"
          description="Manage your submitted ride requests."
          action={
            <Button asChild className="rounded-xl">
              <Link href="/passenger/request-ride">
                <Plus className="mr-2 h-4 w-4" />
                Request Ride
              </Link>
            </Button>
          }
        />

        {/* Active Requests */}
        {activeRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Requests
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {activeRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden border border-border bg-card">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-semibold text-base leading-tight">
                      {request.pickup_location} → {request.destination}
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Departure: <span className="font-medium text-foreground">{new Date(request.departure_time).toLocaleString()}</span>
                      </p>
                      <p>Seats Needed: <span className="font-medium text-foreground">{request.seats_needed}</span></p>
                      <p className="flex items-center gap-2 mt-1">
                        Status:{" "}
                        {request.status === "open" ? (
                          <span className="inline-flex items-center rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-semibold text-yellow-500">
                            Waiting for Driver
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                            Driver Assigned
                          </span>
                        )}
                      </p>
                    </div>
                    {request.status === "open" && (
                      <Button
                        variant="destructive"
                        className="w-full rounded-xl text-sm"
                        onClick={() => cancelRequestByPassenger(request.id)}
                      >
                        Cancel Request
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past Requests */}
        {pastRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mt-6">
              <HistoryIcon className="h-4 w-4 text-muted-foreground" />
              Request History
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {pastRequests.map((request) => (
                <Card key={request.id} className="opacity-85 hover:opacity-100 transition-opacity">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-semibold text-base leading-tight">
                      {request.pickup_location} → {request.destination}
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Departure: <span>{new Date(request.departure_time).toLocaleString()}</span>
                      </p>
                      <p>Seats Needed: <span>{request.seats_needed}</span></p>
                      <p className="flex items-center gap-2">
                        Status:{" "}
                        {request.status === "completed" ? (
                          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                            Cancelled
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-1">
                      Requested on {new Date(request.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Driver Render (Find Requests)
  const filteredRequests = requests.filter((request) =>
    `${request.pickup_location} ${request.destination}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Find Requests"
        description="Browse passenger ride requests around UTeM corridors."
        action={
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => toast.message("Saved search (mock)")}
          >
            Save this search
          </Button>
        }
      />
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Try 'MITC', 'FTKE', 'Sentral'..."
                className="rounded-xl pl-9"
              />
            </div>
          </div>
          <Button className="rounded-xl sm:shrink-0" onClick={() => toast.success("Filters applied")}>
            Apply
          </Button>
        </CardContent>
      </Card>

      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Requests Found"
          description="Loosen your filters or try a different pickup location."
          action={{
            label: "Reset Filters",
            onClick: () => setSearch(""),
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold">
                  {request.pickup_location} → {request.destination}
                </h3>
                <p>Departure: {new Date(request.departure_time).toLocaleString()}</p>
                <p>Seats Needed: {request.seats_needed}</p>
                {userId !== request.passenger_id && (
                  <Button className="mt-3" onClick={() => acceptRequest(request)}>
                    Accept Request
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}