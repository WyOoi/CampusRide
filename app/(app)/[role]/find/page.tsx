"use client";

import { useMemo, useState, useEffect } from "react";
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
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<RideStatus | "all">("all");
const [rides, setRides] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadRides = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("rides")
      .select("*")
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
    return (
      !q ||
      `${r.pickup_location} ${r.destination}`
        .toLowerCase()
        .includes(q.toLowerCase())
    );
  });
}, [rides, q]);
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
const { data: existingBooking } = await supabase
  .from("bookings")
  .select("*")
  .eq("passenger_id", user.id)
  .eq("booking_status", "pending")
  .maybeSingle();

if (existingBooking) {
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
    message: `A passenger has booked your ride from ${ride.pickup_location} to ${ride.destination}.`,
    is_read: false,
  });
    await supabase
      .from("rides")
      .update({
        available_seats:
          ride.available_seats - 1,
      })
      .eq("id", ride.id);

    toast.success("Ride booked successfully");

    window.location.reload();
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
          <h3 className="font-semibold">
            {ride.pickup_location} → {ride.destination}
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