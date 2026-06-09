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
import { PaymentModal } from "@/components/rides/payment-modal";
import {
  ClipboardList,
  History as HistoryIcon,
  Plus,
  Play,
  CheckCircle,
  CreditCard,
  Wallet,
  Banknote,
  Clock,
  ArrowRight,
  ShieldCheck,
  User,
  Car,
  Phone
} from "lucide-react";

// Helper to parse payment method and ride state out of the destination string
export function parseRideDestination(destStr: string) {
  if (!destStr) return { destination: "", paymentMethod: "cash", rideState: "active" };
  
  // Extract payment method
  let paymentMethod = "cash";
  const payMatch = destStr.match(/\[payment_method:([^\]]+)\]/);
  if (payMatch) {
    paymentMethod = payMatch[1].trim();
  }

  // Extract ride state
  let rideState = "active";
  const stateMatch = destStr.match(/\[ride_state:([^\]]+)\]/);
  if (stateMatch) {
    rideState = stateMatch[1].trim();
  }

  // Clean the destination string from all metadata brackets
  const cleanDest = destStr.replace(/\[[^\]]+\]/g, "").trim();

  return { destination: cleanDest, paymentMethod, rideState };
}

export function formatPhone(phone: string) {
  if (!phone) return "";
  if (phone.startsWith('+60')) return phone;
  return '+60' + phone.replace(/^0/, '');
}

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

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentTripInfo, setPaymentTripInfo] = useState({ pickup: "", destination: "" });
  const [paymentCallback, setPaymentCallback] = useState<() => Promise<void>>(() => async () => {});

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
        // Fetch active passenger bookings (pending, confirmed)
        const { data: activeBookings, error: activeErr } = await supabase
          .from("bookings")
          .select(`
            *,
            rides (*, driver:profiles!driver_id(*))
          `)
          .eq("passenger_id", user.id)
          .in("booking_status", ["pending", "confirmed"])
          .order("created_at", { ascending: false });

        if (activeErr) throw activeErr;
        setActivePassengerBookings(activeBookings || []);

        // Fetch past passenger bookings (completed, cancelled, cancelled_by_driver)
        const { data: pastBookings, error: pastErr } = await supabase
          .from("bookings")
          .select(`
            *,
            rides (*, driver:profiles!driver_id(*))
          `)
          .eq("passenger_id", user.id)
          .in("booking_status", ["completed", "cancelled", "cancelled_by_driver"])
          .order("created_at", { ascending: false });

        if (pastErr) throw pastErr;
        setPastPassengerBookings(pastBookings || []);

        // Fetch active passenger requests (open, accepted)
        const { data: activeReqs, error: activeReqsErr } = await supabase
          .from("ride_requests")
          .select("*")
          .eq("passenger_id", user.id)
          .in("status", ["open", "accepted"])
          .order("departure_time", { ascending: true });

        if (activeReqsErr) throw activeReqsErr;
        
        const activeReqsWithDriver = await Promise.all(
          (activeReqs || []).map(async (req) => {
            if (!req.accepted_driver_id) return { ...req, driver: null };
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', req.accepted_driver_id).single();
            return { ...req, driver: profile };
          })
        );
        setActivePassengerRequests(activeReqsWithDriver);

        // Fetch past passenger requests (completed, cancelled)
        const { data: pastReqs, error: pastReqsErr } = await supabase
          .from("ride_requests")
          .select("*")
          .eq("passenger_id", user.id)
          .in("status", ["completed", "cancelled"])
          .order("created_at", { ascending: false });

        if (pastReqsErr) throw pastReqsErr;
        
        const pastReqsWithDriver = await Promise.all(
          (pastReqs || []).map(async (req) => {
            if (!req.accepted_driver_id) return { ...req, driver: null };
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', req.accepted_driver_id).single();
            return { ...req, driver: profile };
          })
        );
        setPastPassengerRequests(pastReqsWithDriver);

      } else if (role === "driver") {
        // Fetch active/ongoing rides offered by driver (keeps status "active" when in progress)
        const { data: activeRides, error: activeRidesErr } = await supabase
          .from("rides")
          .select("*")
          .eq("driver_id", user.id)
          .eq("status", "active")
          .order("departure_time", { ascending: true });

        if (activeRidesErr) throw activeRidesErr;

        // Fetch bookings count and passengers for each active ride
        const ridesWithCounts = await Promise.all(
          (activeRides || []).map(async (ride) => {
            const { data: bookingRows } = await supabase
              .from("bookings")
              .select("*, passenger:profiles(*)")
              .eq("ride_id", ride.id)
              .in("booking_status", ["pending", "confirmed"]);
            return {
              ...ride,
              bookingCount: bookingRows?.length || 0,
              passengers: bookingRows?.map(b => b.passenger).filter(Boolean) || [],
            };
          })
        );
        setActiveDriverRides(ridesWithCounts);

        // Fetch active/ongoing driver requests (assigned passenger requests - keeps status "accepted" when in progress)
        const { data: activeReqs, error: activeReqsErr } = await supabase
          .from("ride_requests")
          .select("*")
          .eq("accepted_driver_id", user.id)
          .eq("status", "accepted")
          .order("departure_time", { ascending: true });

        if (activeReqsErr) throw activeReqsErr;
        
        const activeReqsWithPassenger = await Promise.all(
          (activeReqs || []).map(async (req) => {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', req.passenger_id).single();
            return { ...req, passenger: profile };
          })
        );
        
        setActiveDriverRequests(activeReqsWithPassenger);

        // Fetch past rides offered by driver (closed/completed)
        const { data: pastRides, error: pastRidesErr } = await supabase
          .from("rides")
          .select("*")
          .eq("driver_id", user.id)
          .in("status", ["closed", "completed"])
          .order("departure_time", { ascending: false });

        if (pastRidesErr) throw pastRidesErr;
        setPastDriverRides(pastRides || []);

        // Fetch past driver requests (completed, cancelled)
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

  // Passenger Checkout Payment
  const triggerPassengerPayment = (booking: any) => {
    const { destination, paymentMethod } = parseRideDestination(booking.rides?.destination);
    setPaymentAmount(booking.rides?.cost_per_person || 0);
    setPaymentMethod(paymentMethod);
    setPaymentTripInfo({
      pickup: booking.rides?.pickup_location || "Origin",
      destination: booking.rides?.destination || "",
    });
    setPaymentCallback(() => async () => {
      // Update booking status to completed
      const { error } = await supabase
        .from("bookings")
        .update({ booking_status: "completed" })
        .eq("id", booking.id);

      if (error) throw error;

      // Add alert to driver
      if (booking.rides?.driver_id) {
        await supabase.from("alerts").insert({
          user_id: booking.rides.driver_id,
          title: "Payment Received",
          message: `Passenger paid RM ${(booking.rides?.cost_per_person || 0).toFixed(2)} via card/eWallet.`,
        });
      }
      loadData();
    });
    setPaymentModalOpen(true);
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

      toast.success("Ride closed successfully");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to close ride");
    }
  };

  // Start Ride (append [ride_state:in_progress] to destination suffix to bypass table checks)
  const handleStartRide = async (ride: any) => {
    try {
      let dest = ride.destination;
      if (dest.includes("[ride_state:")) {
        dest = dest.replace(/\[ride_state:[^\]]+\]/, "[ride_state:in_progress]");
      } else {
        dest = `${dest} [ride_state:in_progress]`;
      }

      const { error } = await supabase
        .from("rides")
        .update({ destination: dest })
        .eq("id", ride.id);

      if (error) throw error;
      toast.success("Ride started! Drive safely.");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to start ride");
    }
  };

  const handleStartRequestRide = async (request: any) => {
    try {
      let dest = request.destination;
      if (dest.includes("[ride_state:")) {
        dest = dest.replace(/\[ride_state:[^\]]+\]/, "[ride_state:in_progress]");
      } else {
        dest = `${dest} [ride_state:in_progress]`;
      }

      const { error } = await supabase
        .from("ride_requests")
        .update({ destination: dest })
        .eq("id", request.id);

      if (error) throw error;
      toast.success("Ride request started! Drive safely.");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to start ride");
    }
  };

  // Complete Ride & Open Payment Modal (Driver Side)
  const triggerCompleteRide = async (ride: any) => {
    const { destination, paymentMethod } = parseRideDestination(ride.destination);
    
    // Total ride cost collected from bookings (exclude pending, only confirmed)
    const { data: confirmedBookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("ride_id", ride.id)
      .eq("booking_status", "confirmed");

    const bookingCount = confirmedBookings?.length || 0;
    const totalAmount = ride.cost_per_person * bookingCount;

    setPaymentAmount(totalAmount || ride.cost_per_person);
    setPaymentMethod(paymentMethod);
    setPaymentTripInfo({
      pickup: ride.pickup_location,
      destination: ride.destination,
    });

    setPaymentCallback(() => async () => {
      // Remove [ride_state:in_progress] suffix and update status to closed
      let dest = ride.destination;
      dest = dest.replace(/\s*\[ride_state:[^\]]+\]/, "");

      const { error: rideErr } = await supabase
        .from("rides")
        .update({ 
          status: "closed",
          destination: dest
        })
        .eq("id", ride.id);
      
      if (rideErr) throw rideErr;

      // Complete all confirmed bookings on this ride
      const { error: bookingErr } = await supabase
        .from("bookings")
        .update({ booking_status: "completed" })
        .eq("ride_id", ride.id)
        .eq("booking_status", "confirmed");

      if (bookingErr) throw bookingErr;

      // Notify passengers
      if (confirmedBookings && confirmedBookings.length > 0) {
        const alerts = confirmedBookings.map((b) => ({
          user_id: b.passenger_id,
          title: "Ride Completed",
          message: `Your ride from ${ride.pickup_location} has completed. Payment: RM ${ride.cost_per_person.toFixed(2)} via ${paymentMethod.toUpperCase()}.`,
        }));
        await supabase.from("alerts").insert(alerts);
      }

      // Notify driver
      await supabase.from("alerts").insert({
        user_id: ride.driver_id,
        title: "Ride Completed",
        message: `You have successfully completed your ride to ${dest.replace(/\[[^\]]+\]/g, "").trim()}.`,
      });

      loadData();
    });

    setPaymentModalOpen(true);
  };

  const triggerCompleteRequestRide = (request: any) => {
    const { destination, paymentMethod } = parseRideDestination(request.destination);
    
    // Request is individual request, cost is estimated or preset
    const amount = 5; // Default estimate
    setPaymentAmount(amount);
    setPaymentMethod(paymentMethod);
    setPaymentTripInfo({
      pickup: request.pickup_location,
      destination: request.destination,
    });

    setPaymentCallback(() => async () => {
      // Remove ongoing suffix and update requests status to completed
      let dest = request.destination;
      dest = dest.replace(/\s*\[ride_state:[^\]]+\]/, "");

      const { error } = await supabase
        .from("ride_requests")
        .update({ 
          status: "completed",
          destination: dest
        })
        .eq("id", request.id);

      if (error) throw error;

      await supabase.from("alerts").insert({
        user_id: request.passenger_id,
        title: "Ride Completed",
        message: `Your ride request has completed. Paid RM ${amount.toFixed(2)} via ${paymentMethod.toUpperCase()}.`,
      });

      loadData();
    });

    setPaymentModalOpen(true);
  };

  const cancelDriverRequestRide = async (requestId: string) => {
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

  // Ongoing logic segregation using destination suffix
  // Passenger ongoing/pending payments
  const ongoingPassengerBookings = activePassengerBookings.filter((b) => {
    const { rideState } = parseRideDestination(b.rides?.destination);
    return rideState === "in_progress";
  });
  
  const pendingPaymentPassengerBookings = activePassengerBookings.filter((b) => {
    // If the ride is closed/completed, but booking status is confirmed (unpaid)
    const isCompleted = b.rides?.status === "completed" || b.rides?.status === "closed";
    return isCompleted && b.booking_status === "confirmed";
  });
  
  const regularActivePassengerBookings = activePassengerBookings.filter((b) => {
    const { rideState } = parseRideDestination(b.rides?.destination);
    const isCompleted = b.rides?.status === "completed" || b.rides?.status === "closed";
    return rideState !== "in_progress" && !isCompleted;
  });

  const ongoingPassengerRequests = activePassengerRequests.filter((r) => {
    const { rideState } = parseRideDestination(r.destination);
    return rideState === "in_progress";
  });
  
  const regularActivePassengerRequests = activePassengerRequests.filter((r) => {
    const { rideState } = parseRideDestination(r.destination);
    return rideState !== "in_progress";
  });

  // Driver ongoing/active
  const ongoingDriverRides = activeDriverRides.filter((r) => {
    const { rideState } = parseRideDestination(r.destination);
    return rideState === "in_progress";
  });
  const regularActiveDriverRides = activeDriverRides.filter((r) => {
    const { rideState } = parseRideDestination(r.destination);
    return rideState !== "in_progress";
  });

  const ongoingDriverRequests = activeDriverRequests.filter((r) => {
    const { rideState } = parseRideDestination(r.destination);
    return rideState === "in_progress";
  });
  const regularActiveDriverRequests = activeDriverRequests.filter((r) => {
    const { rideState } = parseRideDestination(r.destination);
    return rideState !== "in_progress";
  });

  const hasOngoingPassenger = ongoingPassengerBookings.length > 0 || ongoingPassengerRequests.length > 0 || pendingPaymentPassengerBookings.length > 0;
  const hasOngoingDriver = ongoingDriverRides.length > 0 || ongoingDriverRequests.length > 0;

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

      {/* -------------------- PASSENGER VIEW -------------------- */}
      {role === "passenger" && (
        <div className="space-y-8">
          
          {/* Ongoing Trip Section */}
          {hasOngoingPassenger && (
            <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-md">
              <h2 className="text-base font-bold tracking-tight text-primary flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff3b30] animate-ping" />
                Ongoing Trip Details
              </h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* Bookings currently in progress */}
                {ongoingPassengerBookings.map((booking) => {
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
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" /> Driver
                            </p>
                            <div className="flex flex-col gap-1 bg-muted/30 p-2 rounded-md">
                              <div className="flex justify-between items-center px-1">
                                <span className="font-medium text-foreground flex items-center gap-1">
                                  {booking.rides?.driver?.full_name || "Unknown Driver"}
                                  {booking.rides?.driver?.gender && booking.rides?.driver?.gender !== "Prefer not to say" && (
                                    <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded uppercase tracking-wider">
                                      {booking.rides.driver.gender}
                                    </span>
                                  )}
                                </span>
                              </div>
                              {booking.rides?.driver?.phone_number && (
                                <p className="flex items-center gap-1.5 text-[11px] text-foreground font-medium px-1">
                                  <Phone className="h-3 w-3 text-muted-foreground" /> {formatPhone(booking.rides.driver.phone_number)}
                                </p>
                              )}
                              <p className="flex items-center gap-1.5 text-[11px] text-foreground font-medium px-1">
                                <Car className="h-3 w-3 text-muted-foreground" />
                                {booking.rides?.driver?.vehicle_model ? `${booking.rides.driver.vehicle_color ? booking.rides.driver.vehicle_color + ' ' : ''}${booking.rides.driver.vehicle_model} ${booking.rides.driver.vehicle_plate ? `(${booking.rides.driver.vehicle_plate})` : ''}` : "Perodua Myvi (WXY 1234)"}
                              </p>
                            </div>
                          </div>
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

                {/* Ride requests currently in progress */}
                {ongoingPassengerRequests.map((request) => {
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
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" /> Driver
                            </p>
                            <div className="flex flex-col gap-1 bg-muted/30 p-2 rounded-md">
                              <div className="flex justify-between items-center px-1">
                                <span className="font-medium text-foreground flex items-center gap-1">
                                  {request.driver?.full_name || request.driver?.email || (request.driver ? "No Name Set" : "Fetch Blocked")}
                                  {request.driver?.gender && request.driver?.gender !== "Prefer not to say" && (
                                    <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded uppercase tracking-wider">
                                      {request.driver.gender}
                                    </span>
                                  )}
                                </span>
                              </div>
                              {request.driver?.phone_number && (
                                <p className="flex items-center gap-1.5 text-[11px] text-foreground font-medium px-1">
                                  <Phone className="h-3 w-3 text-muted-foreground" /> {formatPhone(request.driver.phone_number)}
                                </p>
                              )}
                              {request.driver?.vehicle_model && (
                                <p className="flex items-center gap-1.5 text-[11px] text-foreground font-medium px-1">
                                  <Car className="h-3 w-3 text-muted-foreground" />
                                  {request.driver.vehicle_color ? request.driver.vehicle_color + ' ' : ''}{request.driver.vehicle_model} {request.driver.vehicle_plate ? `(${request.driver.vehicle_plate})` : ''}
                                </p>
                              )}
                            </div>
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

                {/* Bookings completed but pending card/eWallet payment */}
                {pendingPaymentPassengerBookings.map((booking) => {
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
                          <p>Driver: <span className="font-medium text-foreground">{booking.rides?.driver?.full_name || "Unknown"}</span>
                            {booking.rides?.driver?.gender && booking.rides?.driver?.gender !== "Prefer not to say" && (
                              <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm uppercase tracking-wide font-semibold">
                                {booking.rides.driver.gender}
                              </span>
                            )}
                          </p>
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
                          <Button
                            onClick={() => triggerPassengerPayment(booking)}
                            className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center justify-center gap-2 shadow-sm"
                          >
                            <ShieldCheck className="h-4 w-4" /> Pay RM {booking.rides?.cost_per_person} Now
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regular Active Bookings & Requests */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Active Bookings & Requests
            </h2>

            {/* Bookings on Offered Rides */}
            {regularActivePassengerBookings.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground">Bookings on Offered Rides</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {regularActivePassengerBookings.map((booking) => {
                    const { destination, paymentMethod } = parseRideDestination(booking.rides?.destination);
                    return (
                      <Card key={booking.id} className="overflow-hidden border border-border bg-card">
                        <CardContent className="p-5 space-y-3">
                          <h3 className="font-semibold text-base leading-tight flex items-center gap-2 flex-wrap">
                            <span>{booking.rides?.pickup_location} → {destination}</span>
                            {booking.rides?.gender_preference && booking.rides?.gender_preference !== "Any" && (
                              <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-sm uppercase tracking-wide font-semibold whitespace-nowrap">
                                {booking.rides.gender_preference}
                              </span>
                            )}
                          </h3>
                          <div className="text-xs text-muted-foreground space-y-1.5">
                            <p>Departure: <span className="font-medium text-foreground">{booking.rides?.departure_time ? new Date(booking.rides.departure_time).toLocaleString() : "N/A"}</span></p>
                            <p>Cost per seat: <span className="font-medium text-foreground">RM {booking.rides?.cost_per_person || "N/A"}</span></p>
                            <div className="flex items-center gap-2">
                              <span>Payment:</span>
                              {renderPaymentBadge(paymentMethod)}
                            </div>
                            <p className="flex items-center gap-2 pt-1">
                              Status:{" "}
                              {booking.booking_status === "pending" ? (
                                <span className="inline-flex items-center rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-semibold text-yellow-500">
                                  Pending Confirmation
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-[#34c759]/15 px-2.5 py-0.5 text-xs font-semibold text-[#34c759]">
                                  Confirmed
                                </span>
                              )}
                            </p>
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" /> Driver
                              </p>
                              <div className="flex flex-col gap-1 bg-muted/30 p-2 rounded-md">
                                <div className="flex justify-between items-center px-1">
                                  <span className="font-medium text-foreground flex items-center gap-1">
                                    {booking.rides?.driver?.full_name || booking.rides?.driver?.email || (booking.rides?.driver ? "No Name Set" : "Fetch Blocked")}
                                    {booking.rides?.driver?.gender && booking.rides?.driver?.gender !== "Prefer not to say" && (
                                      <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded uppercase tracking-wider">
                                        {booking.rides.driver.gender}
                                      </span>
                                    )}
                                  </span>
                                </div>
                                {booking.rides?.driver?.phone_number && (
                                  <p className="flex items-center gap-1.5 text-[11px] text-foreground font-medium px-1">
                                    <Phone className="h-3 w-3 text-muted-foreground" /> {formatPhone(booking.rides.driver.phone_number)}
                                  </p>
                                )}
                                <p className="flex items-center gap-1.5 text-[11px] text-foreground font-medium px-1">
                                  <Car className="h-3 w-3 text-muted-foreground" />
                                  {booking.rides?.driver?.vehicle_model ? `${booking.rides.driver.vehicle_color ? booking.rides.driver.vehicle_color + ' ' : ''}${booking.rides.driver.vehicle_model} ${booking.rides.driver.vehicle_plate ? `(${booking.rides.driver.vehicle_plate})` : ''}` : "Perodua Myvi (WXY 1234)"}
                                </p>
                              </div>
                            </div>
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
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ride Requests */}
            {regularActivePassengerRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground">Submitted Ride Requests</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {regularActivePassengerRequests.map((request) => {
                    const { destination, paymentMethod } = parseRideDestination(request.destination);
                    return (
                      <Card key={request.id} className="overflow-hidden border border-border bg-card">
                        <CardContent className="p-5 space-y-3">
                          <h3 className="font-semibold text-base leading-tight flex items-center gap-2 flex-wrap">
                            <span>{request.pickup_location} → {destination}</span>
                            {request.gender_preference && request.gender_preference !== "Any" && (
                              <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-sm uppercase tracking-wide font-semibold whitespace-nowrap">
                                {request.gender_preference}
                              </span>
                            )}
                          </h3>
                          <div className="text-xs text-muted-foreground space-y-1.5">
                            <p>Departure: <span className="font-medium text-foreground">{new Date(request.departure_time).toLocaleString()}</span></p>
                            <p>Seats Needed: <span className="font-medium text-foreground">{request.seats_needed}</span></p>
                            <div className="flex items-center gap-2">
                              <span>Payment:</span>
                              {renderPaymentBadge(paymentMethod)}
                            </div>
                            <p className="flex items-center gap-2 pt-1">
                              Status:{" "}
                              {request.status === "open" ? (
                                <span className="inline-flex items-center rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-semibold text-yellow-500">
                                  Waiting for Driver
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-[#34c759]/15 px-2.5 py-0.5 text-xs font-semibold text-[#34c759]">
                                  Driver Assigned
                                </span>
                              )}
                            </p>
                            {request.status !== "open" && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <p className="font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5" /> Driver
                                </p>
                                <div className="flex flex-col gap-1 bg-muted/30 p-2 rounded-md">
                                  <div className="flex justify-between items-center px-1">
                                    <span className="font-medium text-foreground flex items-center gap-1">
                                      {request.driver?.full_name || "Unknown"}
                                      {request.driver?.gender && request.driver?.gender !== "Prefer not to say" && (
                                        <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded uppercase tracking-wider">
                                          {request.driver.gender}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  {request.driver?.phone_number && (
                                    <p className="flex items-center gap-1.5 text-[11px] text-foreground font-medium px-1">
                                      <Phone className="h-3 w-3 text-muted-foreground" /> {formatPhone(request.driver.phone_number)}
                                    </p>
                                  )}
                                  {request.driver?.vehicle_model && (
                                    <p className="flex items-center gap-1.5 text-[11px] text-foreground font-medium px-1">
                                      <Car className="h-3 w-3 text-muted-foreground" />
                                      {request.driver.vehicle_color ? request.driver.vehicle_color + ' ' : ''}{request.driver.vehicle_model} {request.driver.vehicle_plate ? `(${request.driver.vehicle_plate})` : ''}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
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
                    );
                  })}
                </div>
              </div>
            )}

            {regularActivePassengerBookings.length === 0 && regularActivePassengerRequests.length === 0 && (
              <p className="text-xs text-muted-foreground italic pl-1">No other active bookings or requests.</p>
            )}
          </div>

          {/* Past Passenger Orders */}
          {pastPassengerBookings.length > 0 || pastPassengerRequests.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mt-6">
                <HistoryIcon className="h-5 w-5 text-muted-foreground" />
                Order History
              </h2>

              {/* Booking History */}
              {pastPassengerBookings.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-muted-foreground">Bookings History</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {pastPassengerBookings.map((booking) => {
                      const { destination, paymentMethod } = parseRideDestination(booking.rides?.destination);
                      return (
                        <Card key={booking.id} className="opacity-85 hover:opacity-100 transition-opacity">
                          <CardContent className="p-5 space-y-3">
                            <h3 className="font-semibold text-base leading-tight">
                              {booking.rides?.pickup_location} → {destination}
                            </h3>
                            <div className="text-xs text-muted-foreground space-y-1.5">
                              <p>Departure: <span>{booking.rides?.departure_time ? new Date(booking.rides.departure_time).toLocaleString() : "N/A"}</span></p>
                              <p>Cost per seat: <span>RM {booking.rides?.cost_per_person || "N/A"}</span></p>
                              <div className="flex items-center gap-2">
                                <span>Payment:</span>
                                {renderPaymentBadge(paymentMethod)}
                              </div>
                              <p className="flex items-center gap-2 pt-1">
                                Status:{" "}
                                {booking.booking_status === "completed" ? (
                                  <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                                    Completed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                                    {booking.booking_status === "cancelled_by_driver" ? "Cancelled by Driver" : "Cancelled"}
                                  </span>
                                )}
                              </p>
                            </div>
                            <p className="text-[10px] text-muted-foreground pt-1">
                              Booked on {new Date(booking.created_at).toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Request History */}
              {pastPassengerRequests.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-muted-foreground">Ride Requests History</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {pastPassengerRequests.map((request) => {
                      const { destination, paymentMethod } = parseRideDestination(request.destination);
                      return (
                        <Card key={request.id} className="opacity-85 hover:opacity-100 transition-opacity">
                          <CardContent className="p-5 space-y-3">
                            <h3 className="font-semibold text-base leading-tight">
                              {request.pickup_location} → {destination}
                            </h3>
                            <div className="text-xs text-muted-foreground space-y-1.5">
                              <p>Departure: <span>{new Date(request.departure_time).toLocaleString()}</span></p>
                              <p>Seats Needed: <span>{request.seats_needed}</span></p>
                              <div className="flex items-center gap-2">
                                <span>Payment:</span>
                                {renderPaymentBadge(paymentMethod)}
                              </div>
                              <p className="flex items-center gap-2 pt-1">
                                Status:{" "}
                                {request.status === "completed" ? (
                                  <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                                    Completed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                                    Cancelled
                                  </span>
                                )}
                              </p>
                            </div>
                            <p className="text-[10px] text-muted-foreground pt-1">
                              Requested on {new Date(request.created_at).toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* -------------------- DRIVER VIEW -------------------- */}
      {role === "driver" && (
        <div className="space-y-8">
          
          {/* Ongoing Ride Section */}
          {hasOngoingDriver && (
            <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-md">
              <h2 className="text-base font-bold tracking-tight text-primary flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff3b30] animate-ping" />
                Ongoing Active Trip
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Offered rides ongoing */}
                {ongoingDriverRides.map((ride) => {
                  const { destination, paymentMethod } = parseRideDestination(ride.destination);
                  return (
                    <Card key={ride.id} className="overflow-hidden border border-primary/20 bg-card/90">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-base leading-tight">
                            {ride.pickup_location} → {destination}
                          </h3>
                          <span className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                            Driving
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Seats Filled: <span className="font-medium text-foreground">{ride.bookingCount}</span></p>
                          <p>Fare: <span className="font-medium text-foreground">RM {ride.cost_per_person.toFixed(2)} / person</span></p>
                          <div className="flex items-center gap-2 mt-2">
                            <span>Payment:</span>
                            {renderPaymentBadge(paymentMethod)}
                          </div>
                          
                          {/* Passenger Info */}
                          {ride.passengers && ride.passengers.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" /> Passengers onboard
                              </p>
                              <div className="space-y-1.5">
                                {ride.passengers.map((p: any, idx: number) => (
                                  <div key={idx} className="flex flex-col gap-1 bg-muted/30 p-2 rounded-md">
                                    <div className="flex justify-between items-center px-1">
                                      <span className="font-medium text-foreground flex items-center gap-1">
                                        {p?.full_name || "Unknown Passenger"}
                                        {p?.gender && p?.gender !== "Prefer not to say" && (
                                          <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded uppercase tracking-wider">
                                            {p.gender}
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded-sm">1 Seat</span>
                                    </div>
                                    {p?.phone_number && (
                                      <p className="flex items-center gap-1.5 text-[11px] text-foreground font-medium px-1">
                                        <Phone className="h-3 w-3 text-muted-foreground" /> {p.phone_number}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" className="flex-1 rounded-xl text-xs gap-1.5">
                            <Link href={`/driver/tracking/r5`}>
                              <Car className="h-3.5 w-3.5" /> Track
                            </Link>
                          </Button>
                          <Button
                            onClick={() => triggerCompleteRide(ride)}
                            className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs gap-1.5 shadow-sm"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Complete Ride
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Accepted passenger requests ongoing */}
                {ongoingDriverRequests.map((request) => {
                  const { destination, paymentMethod } = parseRideDestination(request.destination);
                  return (
                    <Card key={request.id} className="overflow-hidden border border-primary/20 bg-card/90">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-base leading-tight">
                            {request.pickup_location} → {destination}
                          </h3>
                          <span className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                            Driving
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Passenger Seats: <span className="font-medium text-foreground">{request.seats_needed}</span></p>
                          <div className="flex items-center gap-2 mt-2">
                            <span>Payment:</span>
                            {renderPaymentBadge(paymentMethod)}
                          </div>
                          
                          {/* Passenger Info */}
                          {request.passenger && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" /> Passenger onboard
                              </p>
                              <div className="flex flex-col gap-1 bg-muted/30 p-2 rounded-md">
                                <div className="flex justify-between items-center px-1">
                                  <span className="font-medium text-foreground flex items-center gap-1">
                                    {request.passenger.full_name || "Unknown Passenger"}
                                    {request.passenger.gender && request.passenger.gender !== "Prefer not to say" && (
                                      <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded uppercase tracking-wider">
                                        {request.passenger.gender}
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded-sm">{request.seats_needed} Seat(s)</span>
                                </div>
                                {request.passenger.phone_number && (
                                  <p className="flex items-center gap-1.5 text-[11px] text-foreground font-medium px-1">
                                    <Phone className="h-3 w-3 text-muted-foreground" /> {request.passenger.phone_number}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" className="flex-1 rounded-xl text-xs gap-1.5">
                            <Link href={`/driver/tracking/r5`}>
                              <Car className="h-3.5 w-3.5" /> Track
                            </Link>
                          </Button>
                          <Button
                            onClick={() => triggerCompleteRequestRide(request)}
                            className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs gap-1.5 shadow-sm"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Complete Ride
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regular Driver Orders & Offered Rides */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Active Offered Rides & Requests
            </h2>

            {/* Offered Rides */}
            {regularActiveDriverRides.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground">Offered Rides</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {regularActiveDriverRides.map((ride) => {
                    const { destination, paymentMethod } = parseRideDestination(ride.destination);
                    return (
                      <Card key={ride.id} className="overflow-hidden border border-border bg-card">
                        <CardContent className="p-5 space-y-3">
                          <h3 className="font-semibold text-base leading-tight">
                            {ride.pickup_location} → {destination}
                          </h3>
                          <div className="text-xs text-muted-foreground space-y-1.5">
                            <p>Departure: <span className="font-medium text-foreground">{new Date(ride.departure_time).toLocaleString()}</span></p>
                            <p>Seats Available: <span className="font-medium text-foreground">{ride.available_seats}</span></p>
                            <p>Confirmed Bookings: <span className="font-medium text-foreground">{ride.bookingCount}</span></p>
                            <div className="flex items-center gap-2">
                              <span>Payment:</span>
                              {renderPaymentBadge(paymentMethod)}
                            </div>
                            
                            {/* Passenger Info */}
                            {ride.passengers && ride.passengers.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <p className="font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5" /> Passengers
                                </p>
                                <div className="space-y-1.5">
                                  {ride.passengers.map((p: any, idx: number) => (
                                    <div key={idx} className="flex flex-col gap-1 bg-muted/30 p-2 rounded-md">
                                      <div className="flex justify-between items-center px-1">
                                        <span className="font-medium text-foreground flex items-center gap-1">
                                          {p?.full_name || "Unknown Passenger"}
                                          {p?.gender && p?.gender !== "Prefer not to say" && (
                                            <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded uppercase tracking-wider">
                                              {p.gender}
                                            </span>
                                          )}
                                        </span>
                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded-sm">1 Seat</span>
                                      </div>
                                      {p?.phone_number && (
                                        <p className="flex items-center gap-1.5 text-[11px] text-foreground font-medium px-1">
                                          <Phone className="h-3 w-3 text-muted-foreground" /> {p.phone_number}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button
                              onClick={() => handleStartRide(ride)}
                              className="flex-1 rounded-xl text-xs gap-1 bg-primary text-primary-foreground font-semibold"
                            >
                              <Play className="h-3 w-3 fill-current" /> Start Ride
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1 rounded-xl text-xs"
                              onClick={() => handleCloseRide(ride.id)}
                            >
                              Close Ride
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Accepted Requests */}
            {regularActiveDriverRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground">Accepted Passenger Requests</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {regularActiveDriverRequests.map((request) => {
                    const { destination, paymentMethod } = parseRideDestination(request.destination);
                    return (
                      <Card key={request.id} className="overflow-hidden border border-border bg-card">
                        <CardContent className="p-5 space-y-3">
                          <h3 className="font-semibold text-base leading-tight">
                            {request.pickup_location} → {destination}
                          </h3>
                          <div className="text-xs text-muted-foreground space-y-1.5">
                            <p>Departure: <span className="font-medium text-foreground">{new Date(request.departure_time).toLocaleString()}</span></p>
                            <p>Seats Needed: <span className="font-medium text-foreground">{request.seats_needed}</span></p>
                            <div className="flex items-center gap-2">
                              <span>Payment:</span>
                              {renderPaymentBadge(paymentMethod)}
                            </div>
                            
                            {/* Passenger Info */}
                            {request.passenger && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <p className="font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5" /> Passenger
                                </p>
                                <div className="flex flex-col gap-1 bg-muted/30 p-2 rounded-md">
                                  <div className="flex justify-between items-center px-1">
                                    <span className="font-medium text-foreground flex items-center gap-1">
                                      {request.passenger.full_name || "Unknown Passenger"}
                                      {request.passenger.gender && request.passenger.gender !== "Prefer not to say" && (
                                        <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded uppercase tracking-wider">
                                          {request.passenger.gender}
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded-sm">{request.seats_needed} Seat(s)</span>
                                  </div>
                                  {request.passenger.phone_number && (
                                    <p className="flex items-center gap-1.5 text-[11px] text-foreground font-medium px-1">
                                      <Phone className="h-3 w-3 text-muted-foreground" /> {request.passenger.phone_number}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button
                              onClick={() => handleStartRequestRide(request)}
                              className="flex-1 rounded-xl text-xs gap-1 bg-primary text-primary-foreground font-semibold"
                            >
                              <Play className="h-3 w-3 fill-current" /> Start Ride
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1 rounded-xl text-xs"
                              onClick={() => cancelDriverRequestRide(request.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {regularActiveDriverRides.length === 0 && regularActiveDriverRequests.length === 0 && (
              <p className="text-xs text-muted-foreground italic pl-1">No other active offered rides or requests.</p>
            )}
          </div>

          {/* Past Driver Orders */}
          {pastDriverRides.length > 0 || pastDriverRequests.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mt-6">
                <HistoryIcon className="h-5 w-5 text-muted-foreground" />
                Order History
              </h2>

              {/* Offered Rides History */}
              {pastDriverRides.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-muted-foreground">Offered Rides History</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {pastDriverRides.map((ride) => {
                      const { destination, paymentMethod } = parseRideDestination(ride.destination);
                      return (
                        <Card key={ride.id} className="opacity-85 hover:opacity-100 transition-opacity">
                          <CardContent className="p-5 space-y-2">
                            <h3 className="font-semibold text-base leading-tight">
                              {ride.pickup_location} → {destination}
                            </h3>
                            <div className="text-xs text-muted-foreground space-y-1.5">
                              <p>Departure: <span>{new Date(ride.departure_time).toLocaleString()}</span></p>
                              <p>Cost per seat: <span>RM {ride.cost_per_person}</span></p>
                              <div className="flex items-center gap-2">
                                <span>Payment:</span>
                                {renderPaymentBadge(paymentMethod)}
                              </div>
                              <p className="flex items-center gap-2 pt-1">
                                Status:{" "}
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ride.status === 'completed' || ride.status === 'closed' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                  {ride.status === "completed" || ride.status === "closed" ? "Completed Offer" : "Closed Offer"}
                                </span>
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Requests History */}
              {pastDriverRequests.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-muted-foreground">Passenger Requests History</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {pastDriverRequests.map((request) => {
                      const { destination, paymentMethod } = parseRideDestination(request.destination);
                      return (
                        <Card key={request.id} className="opacity-85 hover:opacity-100 transition-opacity">
                          <CardContent className="p-5 space-y-2">
                            <h3 className="font-semibold text-base leading-tight">
                              {request.pickup_location} → {destination}
                            </h3>
                            <div className="text-xs text-muted-foreground space-y-1.5">
                              <p>Departure: <span>{new Date(request.departure_time).toLocaleString()}</span></p>
                              <p>Seats Needed: <span>{request.seats_needed}</span></p>
                              <div className="flex items-center gap-2">
                                <span>Payment:</span>
                                {renderPaymentBadge(paymentMethod)}
                              </div>
                              <p className="flex items-center gap-2 pt-1">
                                Status:{" "}
                                {request.status === "completed" ? (
                                  <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
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
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Payment checkout modal container */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={paymentCallback}
        amount={paymentAmount}
        paymentMethod={paymentMethod}
        tripInfo={paymentTripInfo}
        role={role}
      />
    </div>
  );
}
