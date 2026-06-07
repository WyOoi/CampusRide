"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/empty-state";
import {
  Search,
  ClipboardList,
  History as HistoryIcon,
  Plus,
  MapPin,
  Calendar,
  Users,
  Wallet,
  CreditCard,
  Banknote,
  ShieldCheck
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoutePreviewMap } from "@/components/maps/dynamic-maps";
import { Separator } from "@/components/ui/separator";

// Helper to parse payment method and destination
export function parseRideDestination(destStr: string) {
  if (!destStr) return { destination: "", paymentMethod: "cash", rideState: "active" };
  
  let paymentMethod = "cash";
  const payMatch = destStr.match(/\[payment_method:([^\]]+)\]/);
  if (payMatch) {
    paymentMethod = payMatch[1].trim();
  }

  let rideState = "active";
  const stateMatch = destStr.match(/\[ride_state:([^\]]+)\]/);
  if (stateMatch) {
    rideState = stateMatch[1].trim();
  }

  const cleanDest = destStr
    .replace(/\[payment_method:[^\]]+\]/g, "")
    .replace(/\[ride_state:[^\]]+\]/g, "")
    .trim();

  return { destination: cleanDest, paymentMethod, rideState };
}

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

  // Details Modal state
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
          {filteredRequests.map((request) => {
            const { destination, paymentMethod } = parseRideDestination(request.destination);
            return (
              <Card key={request.id} className="overflow-hidden border border-border bg-card">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-base leading-tight text-foreground">
                      {request.pickup_location} → {destination}
                    </h3>
                    {paymentMethod === "tng" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-500 uppercase">
                        <Wallet className="h-3 w-3" /> TNG
                      </span>
                    )}
                    {paymentMethod === "card" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-500 uppercase">
                        <CreditCard className="h-3 w-3" /> Card (Stripe)
                      </span>
                    )}
                    {paymentMethod === "cash" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500 uppercase">
                        <Banknote className="h-3 w-3" /> Cash
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Departure: <span className="font-medium text-foreground">{new Date(request.departure_time).toLocaleString()}</span></p>
                    <p>Seats Needed: <span className="font-medium text-foreground">{request.seats_needed}</span></p>
                  </div>
                  {userId !== request.passenger_id && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="secondary"
                        className="flex-1 rounded-xl text-xs"
                        onClick={() => {
                          setSelectedRequest(request);
                          setDetailsOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        className="flex-1 rounded-xl text-xs font-semibold"
                        onClick={() => acceptRequest(request)}
                      >
                        Accept Request
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={(open) => !open && setDetailsOpen(false)}>
        {selectedRequest && (() => {
          const { destination, paymentMethod } = parseRideDestination(selectedRequest.destination);
          const estPrice = Math.max(4, selectedRequest.seats_needed * 3);
          
          return (
            <DialogContent className="sm:max-w-lg overflow-hidden rounded-2xl border border-border bg-card">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">
                  Ride Request Details
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  View pickup, route map, and passenger parameters before accepting.
                </DialogDescription>
              </DialogHeader>

              <Separator />

              <div className="space-y-4 py-2">
                {/* Route visualization map */}
                <div className="rounded-xl overflow-hidden border border-border h-48 bg-muted relative">
                  <RoutePreviewMap
                    from={[2.3135, 102.3212]} // UTeM Main Campus coords
                    to={[2.2215, 102.2511]}   // Melaka Sentral coords
                    className="w-full h-full"
                  />
                  <div className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur px-2.5 py-1 rounded-lg border border-border text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span>Route preview (Map)</span>
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-2 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Pickup Origin</span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      {selectedRequest.pickup_location}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Destination</span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      {destination}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Departure Time</span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(selectedRequest.departure_time).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Payment Method</span>
                    <div className="pt-0.5">
                      {paymentMethod === "tng" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-500">
                          <Wallet className="h-3 w-3" /> TNG eWallet
                        </span>
                      )}
                      {paymentMethod === "card" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-500">
                          <CreditCard className="h-3 w-3" /> Card (Stripe)
                        </span>
                      )}
                      {paymentMethod === "cash" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500">
                          <Banknote className="h-3 w-3" /> Cash
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Seats Needed</span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedRequest.seats_needed} Seats
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Estimated Share</span>
                    <span className="font-bold text-foreground flex items-center gap-0.5 text-sm">
                      <span className="text-xs text-muted-foreground font-normal mr-0.5">RM</span>
                      {estPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground flex gap-2 items-start">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Verified Student Ride</span>
                    <p className="mt-0.5">Passenger is a verified student of UTeM. Accept the ride to connect with them directly.</p>
                  </div>
                </div>
              </div>

              <Separator />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="rounded-xl text-xs" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
                <Button
                  className="rounded-xl text-xs font-semibold"
                  onClick={() => {
                    acceptRequest(selectedRequest);
                    setDetailsOpen(false);
                  }}
                >
                  Accept Request
                </Button>
              </DialogFooter>
            </DialogContent>
          );
        })()}
      </Dialog>
    </div>
  );
}