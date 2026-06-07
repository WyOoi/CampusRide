"use client";

import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FareEstimate } from "@/components/rides/fare-estimate";
import { RoutePreviewMap } from "@/components/maps/dynamic-maps";
import { LocationSearch } from "@/components/maps/location-search";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, Navigation, CarFront } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OfferRidePage() {
  const [seats, setSeats] = useState(3);
  const [pickupLocation, setPickupLocation] = useState("UTeM Main Campus");
  const [destination, setDestination] = useState("Melaka Sentral");
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>([2.3135, 102.3212]);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>([2.2215, 102.2511]);
  const [departureTime, setDepartureTime] = useState("");
  const [costPerPerson, setCostPerPerson] = useState(5);
  const [loading, setLoading] = useState(false);
  const [distanceKm, setDistanceKm] = useState(12.4);
  const [isExpanded, setIsExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Automatically calculate suggested cost per seat based on the real road distance
  const suggestedCost = useMemo(() => {
    const toll = distanceKm > 15 ? 2 : 0;
    const total = Math.max(4, Math.round(distanceKm * 0.55 + toll));
    return Math.max(2, Math.round((total / Math.max(1, seats)) * 10) / 10);
  }, [distanceKm, seats]);

  useEffect(() => {
    setCostPerPerson(suggestedCost);
  }, [suggestedCost]);

  // Helper for reverse geocoding
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
      return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
  };

  // HTML5 Geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const userCoords: [number, number] = [latitude, longitude];
          setPickupCoords(userCoords);
          const address = await reverseGeocode(latitude, longitude);
          setPickupLocation(address);
        },
        (err) => {
          console.warn("Geolocation access denied or failed:", err);
        }
      );
    }
  }, []);

  const handleOriginDrag = async (coords: [number, number]) => {
    setPickupCoords(coords);
    const address = await reverseGeocode(coords[0], coords[1]);
    setPickupLocation(address);
  };

  const handleDestinationDrag = async (coords: [number, number]) => {
    setDestinationCoords(coords);
    const address = await reverseGeocode(coords[0], coords[1]);
    setDestination(address);
  };

  const handleRecenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const userCoords: [number, number] = [latitude, longitude];
          setPickupCoords(userCoords);
          const address = await reverseGeocode(latitude, longitude);
          setPickupLocation(address);
          toast.success("Located your position!");
        },
        (err) => {
          toast.error("Unable to get current location");
        }
      );
    }
  };

  const handlePublishRide = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please login first");
        return;
      }

      const finalDestination = `${destination} [payment_method:${paymentMethod}]`;

      const { error } = await supabase.from("rides").insert({
        driver_id: user.id,
        pickup_location: pickupLocation,
        destination: finalDestination,
        departure_time: departureTime,
        available_seats: seats,
        cost_per_person: costPerPerson,
        status: "active",
      });

      if (error) throw error;

      toast.success("Ride published successfully");

      setPickupLocation("");
      setDestination("");
      setPickupCoords(null);
      setDestinationCoords(null);
      setDepartureTime("");
      setSeats(3);
      setCostPerPerson(5);
      setPaymentMethod("cash");
      setIsExpanded(false);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-76px)] overflow-hidden">
      {/* Background Fullscreen Map */}
      <div className="absolute inset-0 w-full h-full z-0">
        {pickupCoords && destinationCoords ? (
          <RoutePreviewMap
            from={pickupCoords}
            to={destinationCoords}
            onRouteCalculated={setDistanceKm}
            onFromChange={handleOriginDrag}
            onToChange={handleDestinationDrag}
            className="w-full h-full"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/20 text-sm text-muted-foreground">
            <span className="animate-pulse">Loading map and locating you...</span>
          </div>
        )}
      </div>

      {/* Floating GPS Recenter Button */}
      <button
        onClick={handleRecenter}
        className="absolute right-4 top-4 z-10 p-3 rounded-full bg-background border border-border shadow-lg text-primary hover:bg-muted transition-colors"
        aria-label="Locate me"
      >
        <Navigation className="h-5 w-5 fill-current" />
      </button>

      {/* Slide up/down panel */}
      <motion.div
        initial={{ height: "76px" }}
        animate={{ height: isExpanded ? "min(540px, 70vh)" : "76px" }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="absolute bottom-4 left-4 right-4 z-30 bg-card text-card-foreground border border-border shadow-2xl rounded-2xl overflow-hidden max-w-xl mx-auto flex flex-col"
      >
        {/* Toggle header bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-col items-center justify-between p-4 cursor-pointer hover:bg-muted/40 border-b border-border select-none"
        >
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mb-2" />
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <CarFront className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Offer a ride</span>
              </div>
              {!isExpanded && (
                <span className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-[400px]">
                  {pickupLocation || "Origin"} ➔ {destination || "Destination"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* Form content */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          <FareEstimate distanceKm={distanceKm} seats={seats} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="origin">Origin (Pickup location)</Label>
              <LocationSearch
                id="origin"
                value={pickupLocation}
                onChange={(val) => {
                  setPickupLocation(val);
                  if (!val) setPickupCoords(null);
                }}
                onSelect={(coords, displayName) => {
                  setPickupLocation(displayName);
                  setPickupCoords(coords);
                }}
                placeholder="UTeM Main Campus"
                className="rounded-xl"
              />
              <span className="text-[10px] text-muted-foreground block">
                Tip: You can drag marker A on the map to choose a pickup spot.
              </span>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="dest">Destination</Label>
              <LocationSearch
                id="dest"
                value={destination}
                onChange={(val) => {
                  setDestination(val);
                  if (!val) setDestinationCoords(null);
                }}
                onSelect={(coords, displayName) => {
                  setDestination(displayName);
                  setDestinationCoords(coords);
                }}
                placeholder="Melaka Sentral"
                className="rounded-xl"
              />
              <span className="text-[10px] text-muted-foreground block">
                Tip: You can drag marker B on the map to choose a destination spot.
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dt">Date & time</Label>
              <Input
                id="dt"
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats">Available seats</Label>
              <Input
                id="seats"
                type="number"
                min={1}
                max={6}
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost per person (RM)</Label>
              <Input
                id="cost"
                type="number"
                min={1}
                value={costPerPerson}
                onChange={(e) => setCostPerPerson(Number(e.target.value))}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method" className="rounded-xl">
                  <SelectValue placeholder="Select payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="tng">Touch 'n Go eWallet</SelectItem>
                  <SelectItem value="card">Debit / Credit Card (Stripe)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle model</Label>
              <Input id="vehicle" defaultValue="Perodua Myvi" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plate">Plate number</Label>
              <Input id="plate" defaultValue="WXY 1234" className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes for passengers</Label>
            <Textarea
              id="notes"
              placeholder="Luggage space, route policy, preferences…"
              className="min-h-[72px]"
            />
          </div>

          <Button
            className="w-full rounded-xl mt-2"
            onClick={handlePublishRide}
            disabled={loading}
          >
            {loading ? "Publishing..." : "Publish Ride"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
