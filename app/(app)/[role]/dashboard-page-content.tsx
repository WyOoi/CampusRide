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
  Car,
  Wallet,
  Banknote,
  ShieldCheck,
} from "lucide-react";
import { useSessionStore } from "@/store/session-store";

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

import { useRouter, useParams } from "next/navigation";

export function parseRideDestination(destStr: string) {
  if (!destStr) return { destination: "", paymentMethod: "cash", rideState: "active" };
  let paymentMethod = "cash";
  const payMatch = destStr.match(/\[payment_method:([^\]]+)\]/);
  if (payMatch) paymentMethod = payMatch[1].trim();
  let rideState = "active";
  const stateMatch = destStr.match(/\[ride_state:([^\]]+)\]/);
  if (stateMatch) rideState = stateMatch[1].trim();
  const cleanDest = destStr.replace(/\[[^\]]+\]/g, "").trim();
  return { destination: cleanDest, paymentMethod, rideState };
}


export default function DashboardPage() {
  const { activeRole, setActiveRole } = useSessionStore();
  const router = useRouter();
  const params = useParams<{ role: string }>();
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
  const [alerts, setAlerts] = useState<any[]>([]);

  const [ongoingData, setOngoingData] = useState<{
    passengerBookings: any[];
    passengerRequests: any[];
    pendingPaymentPassengerBookings: any[];
    driverRides: any[];
    driverRequests: any[];
  }>({
    passengerBookings: [],
    passengerRequests: [],
    pendingPaymentPassengerBookings: [],
    driverRides: [],
    driverRequests: [],
  });
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

    const { data: alertsData } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4);
    if (alertsData) setAlerts(alertsData);

    // Fetch Ongoing Data
    try {
      // Passenger data
      const { data: activeBookings } = await supabase
        .from("bookings")
        .select(`*, rides (*)`)
        .eq("passenger_id", user.id)
        .in("booking_status", ["pending", "confirmed"])
        .order("created_at", { ascending: false });

      const ongoingPassengerBookings = (activeBookings || []).filter((b: any) => {
        const destStr = b.rides?.destination || "";
        return destStr.includes("[ride_state:in_progress]");
      });

      const pendingPaymentPassengerBookings = (activeBookings || []).filter((b: any) => {
        const isCompleted = b.rides?.status === "completed" || b.rides?.status === "closed";
        return isCompleted && b.booking_status === "confirmed";
      });

      const { data: activeReqs } = await supabase
        .from("ride_requests")
        .select("*")
        .eq("passenger_id", user.id)
        .in("status", ["open", "accepted"]);

      const ongoingPassengerRequests = (activeReqs || []).filter((r: any) => {
        return r.destination?.includes("[ride_state:in_progress]");
      });

      // Driver data
      const { data: activeRides } = await supabase
        .from("rides")
        .select("*")
        .eq("driver_id", user.id)
        .eq("status", "active");

      const ongoingDriverRides = (activeRides || []).filter((r: any) => {
        return r.destination?.includes("[ride_state:in_progress]");
      });

      const { data: driverReqs } = await supabase
        .from("ride_requests")
        .select("*")
        .eq("accepted_driver_id", user.id)
        .eq("status", "accepted");

      const ongoingDriverRequests = (driverReqs || []).filter((r: any) => {
        return r.destination?.includes("[ride_state:in_progress]");
      });

      setOngoingData({
        passengerBookings: ongoingPassengerBookings,
        passengerRequests: ongoingPassengerRequests,
        pendingPaymentPassengerBookings: pendingPaymentPassengerBookings,
        driverRides: ongoingDriverRides,
        driverRequests: ongoingDriverRequests
      });
    } catch (e) {
      console.error(e);
    }
    
    const channel = supabase
      .channel(`dashboard-alerts-${Date.now()}-${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          if ((payload.new as any).user_id === user.id) {
            setAlerts((prev) => {
              const newAlert = payload.new as any;
              if (prev.some(a => a.id === newAlert.id)) return prev;
              return [newAlert, ...prev].slice(0, 4);
            });
          }
        }
      )
      .subscribe();
      
    return channel;
  };

  let channel: any;
  loadUser().then(ch => channel = ch);
  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}, [router]);

  const renderPaymentBadge = (method: string) => {
    switch (method) {
      case "tng":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-500">
            <Wallet className="h-3 w-3" /> TNG eWallet
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-500">
            <Banknote className="h-3 w-3" /> Cash
          </span>
        );
    }
  };

  const hasOngoingPassenger = ongoingData.passengerBookings.length > 0 || ongoingData.passengerRequests.length > 0 || ongoingData.pendingPaymentPassengerBookings.length > 0;
  const hasOngoingDriver = ongoingData.driverRides.length > 0 || ongoingData.driverRequests.length > 0;

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
            {params?.role === "passenger" ? (
              <Button asChild className="rounded-xl">
                <Link href="/passenger/request-ride">
                  <Plus className="mr-2 h-4 w-4" />
                  Request ride
                </Link>
              </Button>
            ) : (
              <Button asChild className="rounded-xl">
                <Link href="/offer">
                  <Plus className="mr-2 h-4 w-4" />
                  Offer ride
                </Link>
              </Button>
            )}
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
        <div className="space-y-4">
          {params?.role === "passenger" ? (
            hasOngoingPassenger ? (
              <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-md">
                <h2 className="text-base font-bold tracking-tight text-primary flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff3b30] animate-ping" />
                  Ongoing Trip Details
                </h2>
                
                <div className="grid gap-4">
                  {ongoingData.passengerBookings.map((booking) => {
                    const { destination, paymentMethod } = parseRideDestination(booking.rides?.destination);
                    return (
                      <Card key={booking.id} className="overflow-hidden border border-primary/20 bg-card/90">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-base leading-tight">
                              {booking.rides?.pickup_location} → {destination}
                            </h3>
                            <span className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                              In Transit
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Driver: <span className="font-medium text-foreground">Active CampusRide Driver</span></p>
                            <p>Vehicle: <span className="font-medium text-foreground">Perodua Myvi (WXY 1234)</span></p>
                            <div className="flex items-center gap-2 mt-2">
                              <span>Payment:</span>
                              {renderPaymentBadge(paymentMethod)}
                            </div>
                          </div>
                          <Button asChild className="w-full rounded-xl gap-2">
                            <Link href={`/passenger/tracking/r5`}>
                              <Car className="h-4 w-4 animate-pulse" /> Track Live Ride
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
  
                  {ongoingData.passengerRequests.map((request) => {
                    const { destination, paymentMethod } = parseRideDestination(request.destination);
                    return (
                      <Card key={request.id} className="overflow-hidden border border-primary/20 bg-card/90">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-base leading-tight">
                              {request.pickup_location} → {destination}
                            </h3>
                            <span className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                              In Transit
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Seats: <span className="font-medium text-foreground">{request.seats_needed}</span></p>
                            <div className="flex items-center gap-2 mt-2">
                              <span>Payment:</span>
                              {renderPaymentBadge(paymentMethod)}
                            </div>
                          </div>
                          <Button asChild className="w-full rounded-xl gap-2">
                            <Link href={`/passenger/tracking/r5`}>
                              <Car className="h-4 w-4" /> Track Live Request
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
  
                  {ongoingData.pendingPaymentPassengerBookings.map((booking) => {
                    const { destination, paymentMethod } = parseRideDestination(booking.rides?.destination);
                    return (
                      <Card key={booking.id} className="overflow-hidden border-2 border-amber-500/40 bg-card/90">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-base leading-tight">
                              {booking.rides?.pickup_location} → {destination}
                            </h3>
                            <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-500">
                              Payment Pending
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Driver: <span className="font-medium text-foreground">Active CampusRide Driver</span></p>
                            <p>Total Fare: <span className="font-semibold text-foreground">RM {booking.rides?.cost_per_person.toFixed(2)}</span></p>
                            <div className="flex items-center gap-2 mt-2">
                              <span>Payment Type:</span>
                              {renderPaymentBadge(paymentMethod)}
                            </div>
                          </div>
                          {paymentMethod === "cash" ? (
                            <div className="text-xs bg-muted p-3 rounded-xl border border-border text-muted-foreground text-center">
                              Please pay <span className="font-bold text-foreground">RM {booking.rides?.cost_per_person}</span> in Cash directly to the driver.
                            </div>
                          ) : (
                            <Button asChild
                              className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center justify-center gap-2 shadow-sm"
                            >
                              <Link href={`/passenger/orders`}>
                                <ShieldCheck className="h-4 w-4" /> Pay RM {booking.rides?.cost_per_person} Now
                              </Link>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ride activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">No active rides at the moment.</p>
                </CardContent>
              </Card>
            )
          ) : (
            hasOngoingDriver ? (
              <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-md">
                <h2 className="text-base font-bold tracking-tight text-primary flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff3b30] animate-ping" />
                  Ongoing Active Trip
                </h2>
                
                <div className="grid gap-4">
                  {ongoingData.driverRides.map((ride) => {
                    const { destination, paymentMethod } = parseRideDestination(ride.destination);
                    return (
                      <Card key={ride.id} className="overflow-hidden border border-primary/20 bg-card/90">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-base leading-tight">
                              {ride.pickup_location} → {destination}
                            </h3>
                            <span className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                              In Transit
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Seats: <span className="font-medium text-foreground">{ride.available_seats} remaining</span></p>
                            <p>Fare/Seat: <span className="font-semibold text-foreground">RM {ride.cost_per_person.toFixed(2)}</span></p>
                            <div className="flex items-center gap-2 mt-2">
                              <span>Accepted:</span>
                              {renderPaymentBadge(paymentMethod)}
                            </div>
                          </div>
                          <Button asChild className="w-full rounded-xl gap-2 bg-red-500 hover:bg-red-600 text-white shadow-sm">
                            <Link href={`/driver/orders`}>
                              Manage Ongoing Trip
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
  
                  {ongoingData.driverRequests.map((request) => {
                    const { destination, paymentMethod } = parseRideDestination(request.destination);
                    return (
                      <Card key={request.id} className="overflow-hidden border border-primary/20 bg-card/90">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-base leading-tight">
                              {request.pickup_location} → {destination}
                            </h3>
                            <span className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                              In Transit
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Seats: <span className="font-medium text-foreground">{request.seats_needed} taken</span></p>
                            <div className="flex items-center gap-2 mt-2">
                              <span>Payment:</span>
                              {renderPaymentBadge(paymentMethod)}
                            </div>
                          </div>
                          <Button asChild className="w-full rounded-xl gap-2 bg-red-500 hover:bg-red-600 text-white shadow-sm">
                            <Link href={`/driver/orders`}>
                              Manage Ongoing Trip
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ride activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">No active rides at the moment.</p>
                </CardContent>
              </Card>
            )
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Notifications</CardTitle>
            <Badge variant="outline" className="rounded-full">
              {alerts.filter((n) => !n.is_read).length} new
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent notifications.</p>
            ) : (
              alerts.map((n, idx) => (
                <div key={`${n.id}-${idx}`} className="rounded-2xl border border-border bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <span className="text-[11px] text-muted-foreground">{formatRelative(n.created_at)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                </div>
              ))
            )}
            <Button asChild variant="secondary" className="w-full rounded-xl">
              <Link href={`/${params?.role || "passenger"}/notifications`}>Open notification center</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
