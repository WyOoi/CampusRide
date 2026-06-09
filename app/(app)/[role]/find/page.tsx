"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner"; 
import { PageHeader } from "@/components/common/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

import { EmptyState } from "@/components/common/empty-state";
import { Search } from "lucide-react";

import type { RideStatus } from "@/types";
import { supabase } from "@/lib/supabase";


export default function FindRidePage() {
  const router = useRouter();
  const params = useParams<{ role: string }>();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<RideStatus | "all">("all");
const [rides, setRides] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [currentUserGender, setCurrentUserGender] = useState<string>("Prefer not to say");

useEffect(() => {
  const loadRides = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("gender").eq("id", user.id).single();
      if (profile && profile.gender) setCurrentUserGender(profile.gender);
    }

    const { data, error } = await supabase
      .from("rides")
      .select("*, driver:profiles!driver_id(*)")
      .eq("status", "active")
      .order("departure_time", { ascending: true });
      console.log("RIDES:", data);
      console.log("ERROR:", error);

    if (error) {
      console.error(error);
      toast.error("Failed to load rides");
    } else {
      setRides(data || []);
    }

    setLoading(false);
  };

  loadRides();
}, []);
const filtered = useMemo(() => {
  return rides.filter((r) => {
    if (r.gender_preference && r.gender_preference !== "Any") {
      if (r.gender_preference === "Male Only" && currentUserGender !== "Male") return false;
      if (r.gender_preference === "Female Only" && currentUserGender !== "Female") return false;
    }

    return (
      !q ||
      `${r.pickup_location} ${r.destination}`
        .toLowerCase()
        .includes(q.toLowerCase())
    );
  });
}, [rides, q, currentUserGender]);
const handleBookRide = async (ride: any) => {
  try {
    const { data: userData } =
      await supabase.auth.getUser();

    const user = userData.user;

    if (!user) {
      toast.error("Please login first");
      return;
    }

    if (ride.available_seats <= 0) {
      toast.error("No seats available");
      return;
    }
    const { data: activeBookings } = await supabase
      .from("bookings")
      .select("*, rides!inner(status)")
      .eq("passenger_id", user.id)
      .in("booking_status", ["pending", "confirmed"])
      .eq("rides.status", "active")
      .limit(1);

    if (activeBookings && activeBookings.length > 0) {
      toast.error("You already have an active booking");
      return;
    }
const { data: duplicateBooking } = await supabase
  .from("bookings")
  .select("*")
  .eq("ride_id", ride.id)
  .eq("passenger_id", user.id)
  .eq("booking_status", "pending")
  .maybeSingle();

if (duplicateBooking) {
  toast.error("You already booked this ride");
  return;
}

if (ride.driver_id === user.id) {
  toast.error("You cannot book your own ride");
  return;
}
    const { error } = await supabase
      .from("bookings")
      .insert({
        ride_id: ride.id,
        passenger_id: user.id,
        booking_status: "pending",
      });

    if (error) throw error;
    await supabase
      .from("alerts")
      .insert({
        user_id: ride.driver_id,
        title: "New Booking",
        message: `A passenger has booked your ride from ${ride.pickup_location} to ${ride.destination.replace(/\[[^\]]+\]/g, "").trim()}.`,
        is_read: false,
      });
    await supabase
      .from("rides")
      .update({
        available_seats:
          ride.available_seats - 1,
      })
      .eq("id", ride.id);

        await supabase.from("alerts").insert({
          user_id: user.id,
          title: "Booking Confirmed",
          message: `You have booked a ride from ${ride.pickup_location} to ${ride.destination.replace(/\[[^\]]+\]/g, "").trim()}.`,
          is_read: false,
        });

    toast.success("Ride booked successfully");

    router.push(`/${params.role}/orders`);
  } catch (error: any) {
    toast.error(error.message);
  }
};
  return (
    <div className="space-y-8">
      <PageHeader
        title="Find a ride"
        description="Search verified drivers around UTeM corridors. Booking buttons are intentionally mocked."
        action={
          <Button variant="secondary" className="rounded-xl" onClick={() => toast.message("Saved search (mock)")}>
            Save this search
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “Sentral”, “FKM”, “MITC”…" className="rounded-xl pl-9" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as RideStatus | "all")}>
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Searching">Searching</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Driver Arriving">Driver Arriving</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="rounded-xl sm:shrink-0" onClick={() => toast.success("Filters applied (mock)")}>
            Apply
          </Button>
        </CardContent>
      </Card>


{filtered.length === 0 ? (
  <EmptyState
    icon={Search}
    title="No rides match"
    description="Loosen your filters or try a landmark near Ayer Keroh / Hang Tuah Jaya."
    action={{
      label: "Reset filters",
      onClick: () => {
        setQ("");
        setStatus("all");
      },
    }}
  />
) : (
  <div className="space-y-4">
    {filtered.map((ride) => (
      <Card key={ride.id}>
        <CardContent className="p-4 space-y-2">
           <h3 className="font-semibold flex items-center gap-2 flex-wrap">
             {/* Clean destination without meta tags */}
             <span>{ride.pickup_location} → {ride.destination.replace(/\[payment_method:[^\]]+\]/g, '').replace(/\[vehicle:[^\]]+\]/g, '').trim()}</span>
             {ride.gender_preference && ride.gender_preference !== "Any" && (
               <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-sm uppercase tracking-wide font-semibold whitespace-nowrap">
                 {ride.gender_preference}
               </span>
             )}
             {/* Payment method */}
             {(() => {
               const match = ride.destination.match(/\[payment_method:([^\]]+)\]/);
               const method = match ? match[1] : null;
               return method ? (
                 <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-sm uppercase">{method}</span>
               ) : null;
             })()}
             {/* Vehicle info */}
             {(() => {
               const match = ride.destination.match(/\[vehicle:([^|]+)\|([^\]]+)\]/);
               if (match) {
                 const model = match[1];
                 const plate = match[2];
                 return (
                   <span className="ml-2 text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-sm uppercase">
                     {model} ({plate})
                   </span>
                 );
               }
               return null;
             })()}
           </h3>

          <p>
            Departure:{" "}
            {new Date(ride.departure_time).toLocaleString()}
          </p>

          <p>
            Available Seats: {ride.available_seats}
          </p>

<p>
  Cost: RM {ride.cost_per_person}
</p>

{ride.driver && (
  <div className="mt-3 p-2 bg-muted/40 rounded-lg text-sm flex justify-between items-center">
    <span className="font-medium text-foreground">Driver: {ride.driver.full_name || "Unknown"}</span>
    {ride.driver.gender && ride.driver.gender !== "Prefer not to say" && (
      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm uppercase tracking-wide font-semibold">
        {ride.driver.gender}
      </span>
    )}
  </div>
)}

<Button
  className="mt-3"
  disabled={ride.available_seats <= 0}
  onClick={() => handleBookRide(ride)}
>
  {ride.available_seats <= 0 ? "Full" : "Book Ride"}
</Button>
        </CardContent>
        
      </Card>
    ))}
  </div>
)}
    </div>
  );
}