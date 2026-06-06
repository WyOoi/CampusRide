"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ClipboardList, History as HistoryIcon, Plus } from "lucide-react";

export default function OrdersPage() {
  const params = useParams<{ role: string }>();
  const router = useRouter();
  const role = params.role;

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Passenger state
  const [activePassengerBookings, setActivePassengerBookings] = useState<any[]>([]);
  const [pastPassengerBookings, setPastPassengerBookings] = useState<any[]>([]);
  const [activePassengerRequests, setActivePassengerRequests] = useState<any[]>([]);
  const [pastPassengerRequests, setPastPassengerRequests] = useState<any[]>([]);

  // Driver state
  const [activeDriverRides, setActiveDriverRides] = useState<any[]>([]);
  const [activeDriverRequests, setActiveDriverRequests] = useState<any[]>([]);
  const [pastDriverRides, setPastDriverRides] = useState<any[]>([]);
  const [pastDriverRequests, setPastDriverRequests] = useState<any[]>([]);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);

    try {
      if (role === "passenger") {
        // Fetch active passenger bookings (pending or confirmed)
        const { data: activeBookings, error: activeErr } = await supabase
          .from("bookings")
          .select(`
            *,
            rides (*)
          `)
          .eq("passenger_id", user.id)
          .in("booking_status", ["pending", "confirmed"])
          .order("created_at", { ascending: false });

        if (activeErr) throw activeErr;
        setActivePassengerBookings(activeBookings || []);

        // Fetch past passenger bookings (completed or cancelled)
        const { data: pastBookings, error: pastErr } = await supabase
          .from("bookings")
          .select(`
            *,
            rides (*)
          `)
          .eq("passenger_id", user.id)
          .in("booking_status", ["completed", "cancelled", "cancelled_by_driver"])
          .order("created_at", { ascending: false });

        if (pastErr) throw pastErr;
        setPastPassengerBookings(pastBookings || []);

        // Fetch active passenger requests (open or accepted)
        const { data: activeReqs, error: activeReqsErr } = await supabase
          .from("ride_requests")
          .select("*")
          .eq("passenger_id", user.id)
          .in("status", ["open", "accepted"])
          .order("departure_time", { ascending: true });

        if (activeReqsErr) throw activeReqsErr;
        setActivePassengerRequests(activeReqs || []);

        // Fetch past passenger requests (completed or cancelled)
        const { data: pastReqs, error: pastReqsErr } = await supabase
          .from("ride_requests")
          .select("*")
          .eq("passenger_id", user.id)
          .in("status", ["completed", "cancelled"])
          .order("created_at", { ascending: false });

        if (pastReqsErr) throw pastReqsErr;
        setPastPassengerRequests(pastReqs || []);

      } else if (role === "driver") {
        // Fetch active rides offered by driver
        const { data: activeRides, error: activeRidesErr } = await supabase
          .from("rides")
          .select("*")
          .eq("driver_id", user.id)
          .eq("status", "active")
          .order("departure_time", { ascending: true });

        if (activeRidesErr) throw activeRidesErr;

        // Fetch bookings count for each active ride
        const ridesWithCounts = await Promise.all(
          (activeRides || []).map(async (ride) => {
            const { data: bookingRows } = await supabase
              .from("bookings")
              .select("*")
              .eq("ride_id", ride.id)
              .eq("booking_status", "pending");
            return {
              ...ride,
              bookingCount: bookingRows?.length || 0,
            };
          })
        );
        setActiveDriverRides(ridesWithCounts);

        // Fetch active driver requests (assigned passenger requests)
        const { data: activeReqs, error: activeReqsErr } = await supabase
          .from("ride_requests")
          .select("*")
          .eq("accepted_driver_id", user.id)
          .eq("status", "accepted")
          .order("departure_time", { ascending: true });

        if (activeReqsErr) throw activeReqsErr;
        setActiveDriverRequests(activeReqs || []);

        // Fetch past rides offered by driver (closed/completed)
        const { data: pastRides, error: pastRidesErr } = await supabase
          .from("rides")
          .select("*")
          .eq("driver_id", user.id)
          .eq("status", "closed")
          .order("departure_time", { ascending: false });

        if (pastRidesErr) throw pastRidesErr;
        setPastDriverRides(pastRides || []);

        // Fetch past driver requests (completed or cancelled requests assigned to driver)
        const { data: pastReqs, error: pastReqsErr } = await supabase
          .from("ride_requests")
          .select("*")
          .eq("accepted_driver_id", user.id)
          .in("status", ["completed", "cancelled"])
          .order("created_at", { ascending: false });

        if (pastReqsErr) throw pastReqsErr;
        setPastDriverRequests(pastReqs || []);
      }
    } catch (err: any) {
      console.error("Error loading order data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 4000);

    return () => clearInterval(interval);
  }, [role]);

  // Passenger action handlers
  const handleCancelBooking = async (
    bookingId: string,
    rideId: string,
    currentSeats: number,
    bookingStatus: string
  ) => {
    if (bookingStatus === "cancelled" || bookingStatus === "cancelled_by_driver") {
      return;
    }
    try {
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ booking_status: "cancelled" })
        .eq("id", bookingId);

      if (bookingError) throw bookingError;

      const { data: bookingData } = await supabase
        .from("bookings")
        .select(`*, rides (*)`)
        .eq("id", bookingId)
        .single();

      if (bookingData?.rides?.driver_id) {
        await supabase.from("alerts").insert({
          user_id: bookingData.rides.driver_id,
          title: "Booking Cancelled",
          message: "A passenger cancelled their booking.",
          is_read: false,
        });
      }

      const { error: updateError } = await supabase
        .from("rides")
        .update({ available_seats: currentSeats + 1 })
        .eq("id", rideId);

      if (updateError) throw updateError;

      toast.success("Booking cancelled successfully");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel booking");
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
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel request");
    }
  };

  // Driver action handlers
  const handleCloseRide = async (rideId: string) => {
    try {
      const { error: rideError } = await supabase
        .from("rides")
        .update({ status: "closed" })
        .eq("id", rideId);

      if (rideError) throw rideError;

      const { data: cancelledBookings, error: bookingError } = await supabase
        .from("bookings")
        .update({ booking_status: "cancelled_by_driver" })
        .eq("ride_id", rideId)
        .eq("booking_status", "pending")
        .select();

      if (bookingError) throw bookingError;

      if (cancelledBookings && cancelledBookings.length > 0) {
        const alerts = cancelledBookings.map((booking) => ({
          user_id: booking.passenger_id,
          title: "Ride Cancelled",
          message: "Your ride has been cancelled by the driver.",
          is_read: false,
        }));
        await supabase.from("alerts").insert(alerts);
      }

      if (userId) {
        await supabase.from("alerts").insert({
          user_id: userId,
          title: "Ride Closed",
          message: "You successfully closed your ride.",
          is_read: false,
        });
      }

      toast.success("Ride closed successfully");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to close ride");
    }
  };

  const completeRequestRide = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .update({ status: "completed" })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("alerts").insert({
        user_id: data.passenger_id,
        title: "Ride Completed",
        message: "Your ride has been marked as completed by the driver.",
      });

      toast.success("Ride marked completed");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to mark ride completed");
    }
  };

  const cancelRequestRide = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .update({ status: "cancelled" })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("alerts").insert({
        user_id: data.passenger_id,
        title: "Ride Cancelled",
        message: "Your ride has been cancelled by the driver.",
      });

      toast.success("Ride cancelled");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel ride");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground animate-pulse">Loading orders...</p>
      </div>
    );
  }

  // Check if passenger or driver has no orders at all
  const hasNoOrders =
    role === "passenger"
      ? activePassengerBookings.length === 0 &&
        pastPassengerBookings.length === 0 &&
        activePassengerRequests.length === 0 &&
        pastPassengerRequests.length === 0
      : activeDriverRides.length === 0 &&
        activeDriverRequests.length === 0 &&
        pastDriverRides.length === 0 &&
        pastDriverRequests.length === 0;

  if (hasNoOrders) {
    return (
      <div className="space-y-8">
        <PageHeader title="Orders" description="Manage your active and completed orders." />
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description={
            role === "passenger"
              ? "Book a ride or submit a ride request to get started."
              : "Offer a ride or check passenger requests to accept."
          }
          action={{
            label: role === "passenger" ? "Find a ride" : "Offer a ride",
            href: role === "passenger" ? "/find" : "/offer",
          }}
        />
      </div>
    );
  }

  const hasActivePassengerOrders = activePassengerBookings.length > 0 || activePassengerRequests.length > 0;
  const hasPastPassengerOrders = pastPassengerBookings.length > 0 || pastPassengerRequests.length > 0;

  const hasActiveDriverOrders = activeDriverRides.length > 0 || activeDriverRequests.length > 0;
  const hasPastDriverOrders = pastDriverRides.length > 0 || pastDriverRequests.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Orders"
        description={role === "passenger" ? "Manage your bookings and ride requests." : "Manage your active and completed orders."}
        action={
          role === "passenger" ? (
            <Button asChild className="rounded-xl">
              <Link href={`/${role}/request-ride`}>
                <Plus className="mr-2 h-4 w-4" />
                Request Ride
              </Link>
            </Button>
          ) : (
            <Button asChild className="rounded-xl">
              <Link href={`/${role}/offer`}>
                <Plus className="mr-2 h-4 w-4" />
                Offer Ride
              </Link>
            </Button>
          )
        }
      />

      {/* PASSENGER VIEW */}
      {role === "passenger" && (
        <div className="space-y-8">
          {/* Active Passenger Orders */}
          {hasActivePassengerOrders && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Bookings & Requests
              </h2>
              
              {/* Active Bookings (from bookings table) */}
              {activePassengerBookings.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Bookings on Offered Rides</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {activePassengerBookings.map((booking) => (
                      <Card key={booking.id} className="overflow-hidden border border-border bg-card">
                        <CardContent className="p-5 space-y-3">
                          <h3 className="font-semibold text-base leading-tight">
                            {booking.rides?.pickup_location} → {booking.rides?.destination}
                          </h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              Departure: <span className="font-medium text-foreground">{booking.rides?.departure_time ? new Date(booking.rides.departure_time).toLocaleString() : "N/A"}</span>
                            </p>
                            <p>Cost per seat: <span className="font-medium text-foreground">RM {booking.rides?.cost_per_person || "N/A"}</span></p>
                            <p className="flex items-center gap-2 mt-1">
                              Status:{" "}
                              {booking.booking_status === "pending" ? (
                                <span className="inline-flex items-center rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-semibold text-yellow-500">
                                  Pending Confirmation
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                                  Confirmed
                                </span>
                              )}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            className="w-full rounded-xl text-sm"
                            onClick={() => handleCancelBooking(booking.id, booking.ride_id, booking.rides?.available_seats ?? 0, booking.booking_status)}
                          >
                            Cancel Booking
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Ride Requests (from ride_requests table) */}
              {activePassengerRequests.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Submitted Ride Requests</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {activePassengerRequests.map((request) => (
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
            </div>
          )}

          {/* Past Passenger Orders */}
          {hasPastPassengerOrders && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mt-6">
                <HistoryIcon className="h-4 w-4 text-muted-foreground" />
                Order History
              </h2>

              {/* Booking History */}
              {pastPassengerBookings.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Bookings History</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {pastPassengerBookings.map((booking) => (
                      <Card key={booking.id} className="opacity-85 hover:opacity-100 transition-opacity">
                        <CardContent className="p-5 space-y-3">
                          <h3 className="font-semibold text-base leading-tight">
                            {booking.rides?.pickup_location} → {booking.rides?.destination}
                          </h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              Departure: <span>{booking.rides?.departure_time ? new Date(booking.rides.departure_time).toLocaleString() : "N/A"}</span>
                            </p>
                            <p>Cost per seat: <span>RM {booking.rides?.cost_per_person || "N/A"}</span></p>
                            <p className="flex items-center gap-2">
                              Status:{" "}
                              {booking.booking_status === "completed" ? (
                                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                                  Completed
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                                  {booking.booking_status === "cancelled_by_driver" ? "Cancelled by Driver" : "Cancelled"}
                                </span>
                              )}
                            </p>
                          </div>
                          <p className="text-[11px] text-muted-foreground pt-1">
                            Booked on {new Date(booking.created_at).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Request History */}
              {pastPassengerRequests.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Ride Requests History</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {pastPassengerRequests.map((request) => (
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
          )}
        </div>
      )}

      {/* DRIVER VIEW */}
      {role === "driver" && (
        <div className="space-y-8">
          {/* Active Driver Orders */}
          {hasActiveDriverOrders && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Orders & Offered Rides
              </h2>

              {/* Driver Active Offered Rides */}
              {activeDriverRides.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Offered Rides</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {activeDriverRides.map((ride) => (
                      <Card key={ride.id} className="overflow-hidden border border-border bg-card">
                        <CardContent className="p-5 space-y-3">
                          <h3 className="font-semibold text-base leading-tight">
                            {ride.pickup_location} → {ride.destination}
                          </h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Departure: <span className="font-medium text-foreground">{new Date(ride.departure_time).toLocaleString()}</span></p>
                            <p>Seats Available: <span className="font-medium text-foreground">{ride.available_seats}</span></p>
                            <p>Bookings: <span className="font-medium text-foreground">{ride.bookingCount}</span></p>
                            <p>Cost per seat: <span className="font-medium text-foreground">RM {ride.cost_per_person}</span></p>
                          </div>
                          {ride.status === "active" && (
                            <Button
                              variant="destructive"
                              className="w-full rounded-xl"
                              onClick={() => handleCloseRide(ride.id)}
                            >
                              Close Ride
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Driver Active Accepted Requests */}
              {activeDriverRequests.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Accepted Passenger Requests</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {activeDriverRequests.map((request) => (
                      <Card key={request.id} className="overflow-hidden border border-border bg-card">
                        <CardContent className="p-5 space-y-3">
                          <h3 className="font-semibold text-base leading-tight">
                            {request.pickup_location} → {request.destination}
                          </h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Departure: <span className="font-medium text-foreground">{new Date(request.departure_time).toLocaleString()}</span></p>
                            <p>Seats Needed: <span className="font-medium text-foreground">{request.seats_needed}</span></p>
                            <p className="flex items-center gap-2 mt-1">
                              Status:{" "}
                              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                                Assigned to You
                              </span>
                            </p>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button
                              className="flex-1 rounded-xl text-sm"
                              onClick={() => completeRequestRide(request.id)}
                            >
                              Complete
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1 rounded-xl text-sm"
                              onClick={() => cancelRequestRide(request.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Past Driver Orders */}
          {hasPastDriverOrders && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mt-6">
                <HistoryIcon className="h-4 w-4 text-muted-foreground" />
                Order History
              </h2>

              {/* Driver Past Offered Rides */}
              {pastDriverRides.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Offered Rides History</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {pastDriverRides.map((ride) => (
                      <Card key={ride.id} className="opacity-85 hover:opacity-100 transition-opacity">
                        <CardContent className="p-5 space-y-2">
                          <h3 className="font-semibold text-base leading-tight">
                            {ride.pickup_location} → {ride.destination}
                          </h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Departure: <span>{new Date(ride.departure_time).toLocaleString()}</span></p>
                            <p>Cost per seat: <span>RM {ride.cost_per_person}</span></p>
                            <p className="flex items-center gap-2">
                              Status:{" "}
                              <span className="inline-flex items-center rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs font-medium text-gray-400">
                                Closed Offer
                              </span>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Driver Past Passenger Requests */}
              {pastDriverRequests.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Passenger Requests History</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {pastDriverRequests.map((request) => (
                      <Card key={request.id} className="opacity-85 hover:opacity-100 transition-opacity">
                        <CardContent className="p-5 space-y-2">
                          <h3 className="font-semibold text-base leading-tight">
                            {request.pickup_location} → {request.destination}
                          </h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Departure: <span>{new Date(request.departure_time).toLocaleString()}</span></p>
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
