"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PhoneCall, ShieldAlert, Navigation } from "lucide-react";
import { toast } from "sonner"; 
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RideStatusBadge } from "@/components/rides/ride-status-badge";
import { RideStatusTimeline } from "@/components/rides/ride-status-timeline";
import { LiveTrackingMap } from "@/components/maps/dynamic-maps";
import { getRideById } from "@/data/mock-rides";
import { supabase } from "@/lib/supabase";

function getDatabaseRideId(rideId: string): string {
  if (rideId.match(/^r\d+$/)) {
    const num = rideId.replace("r", "");
    return `00000000-0000-0000-0000-${num.padStart(12, "0")}`;
  }
  return rideId;
}

export default function LiveTrackingPage() {
  const params = useParams<{ role: string; rideId: string }>();
  const ride = useMemo(() => getRideById(params.rideId), [params.rideId]);
  const [eta, setEta] = useState(62);

  // Live tracking state for driver/passenger
  const [driverCoords, setDriverCoords] = useState<[number, number] | undefined>(undefined);
  const [originCoords, setOriginCoords] = useState<[number, number]>(() => ride?.originCoords || [2.3135, 102.3212]);
  const [etaVal, setEtaVal] = useState<number | null>(null);
  const [distanceRem, setDistanceRem] = useState<number | null>(null);
  const [totalRoadDistance, setTotalRoadDistance] = useState<number | null>(null);

  // Sync originCoords if ride changes (or loads)
  useEffect(() => {
    if (ride) {
      setOriginCoords(ride.originCoords);
    }
  }, [ride]);

  // Poll driver coordinates from the database for the passenger
  useEffect(() => {
    if (params.role !== "passenger") return;

    const dbRideId = getDatabaseRideId(params.rideId);
    
    const fetchDriverCoords = async () => {
      try {
        const { data, error } = await supabase
          .from("rides")
          .select("destination, status")
          .eq("id", dbRideId)
          .maybeSingle();

        if (data) {
          // Parse driver coords from destination string metadata
          const destStr = data.destination;
          const coordsMatch = destStr.match(/\[driver_coords:([^\]]+)\]/);
          if (coordsMatch) {
            const [latStr, lngStr] = coordsMatch[1].split(",");
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            if (!isNaN(lat) && !isNaN(lng)) {
              setDriverCoords([lat, lng]);
              setOriginCoords([lat, lng]); // Driver's position is the new origin for tracking route
            }
          }
        }
      } catch (err) {
        console.error("Error fetching driver coords:", err);
      }
    };

    fetchDriverCoords(); // initial fetch
    const interval = setInterval(fetchDriverCoords, 3000);

    return () => clearInterval(interval);
  }, [params.role, params.rideId, ride]);

  // Fetch driver's location on mount (getCurrentPosition)
  useEffect(() => {
    if (params.role !== "driver") return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userCoords: [number, number] = [latitude, longitude];
          setDriverCoords(userCoords);
          setOriginCoords(userCoords);
        },
        (err) => {
          console.warn("Initial geolocation failed or denied:", err);
        },
        { enableHighAccuracy: true }
      );
    }
  }, [params.role]);

  // Keep watching geolocation in real-time
  useEffect(() => {
    if (params.role !== "driver") return;

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setDriverCoords([latitude, longitude]);
      },
      (error) => {
        console.error("Error watching geolocation:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [params.role]);

  // Update driver coordinates in Supabase in real-time
  useEffect(() => {
    if (params.role !== "driver" || !driverCoords || !ride) return;

    const updateDriverCoordsInDB = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const dbRideId = getDatabaseRideId(params.rideId);
        
        // Clean ride destination to avoid duplicate tags
        const cleanDest = ride.destination
          .replace(/\[payment_method:[^\]]+\]/g, "")
          .replace(/\[driver_coords:[^\]]+\]/g, "")
          .replace(/\[duitnow_qr:[^\]]+\]/g, "")
          .trim();
        const paymentMethod = ride.destination.match(/\[payment_method:([^\]]+)\]/)?.[1] || "tng";

        let finalDest = `${cleanDest} [payment_method:${paymentMethod}] [driver_coords:${driverCoords[0]},${driverCoords[1]}]`;
        if (typeof window !== "undefined") {
          const savedQr = localStorage.getItem("campusride_driver_duitnow_qr");
          if (savedQr && paymentMethod === "tng") {
            finalDest += ` [duitnow_qr:${savedQr}]`;
          }
        }

        // Try updating first
        const { data, error } = await supabase
          .from("rides")
          .update({
            destination: finalDest
          })
          .eq("id", dbRideId)
          .select();

        // If row doesn't exist yet, insert it
        if (error || !data || data.length === 0) {
          await supabase.from("rides").insert({
            id: dbRideId,
            driver_id: user.id,
            pickup_location: ride.origin,
            destination: finalDest,
            departure_time: new Date().toISOString(),
            available_seats: ride.seatsAvailable || 4,
            cost_per_person: ride.pricePerSeatMYR || 5,
            status: "active"
          });
        }
      } catch (err) {
        console.error("Failed to update driver coordinates in DB:", err);
      }
    };

    updateDriverCoordsInDB();
  }, [driverCoords, params.role, params.rideId, ride]);

  // Manual recenter/GPS location refresh
  const handleRecenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userCoords: [number, number] = [latitude, longitude];
          setDriverCoords(userCoords);
          setOriginCoords(userCoords);
          toast.success("Location updated!");
        },
        (err) => {
          toast.error("Unable to get current location");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Calculate percentage progress along the total route distance
  const progressPercent = useMemo(() => {
    if (!ride || !distanceRem || !totalRoadDistance) return eta;
    return Math.max(0, Math.min(100, Math.round(((totalRoadDistance - distanceRem) / totalRoadDistance) * 100)));
  }, [ride, distanceRem, totalRoadDistance, eta]);

  if (!ride) {
    return (
      <div className="space-y-6">
        <PageHeader title="Live tracking" description="We couldn’t find that ride in the mock dataset." />
        <ErrorState
          action={
            <Button asChild className="rounded-xl">
              <Link href={`/${params.role}/find`}>Browse rides</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Live tracking"
        description="Real-time routing using live database geolocation synchronization and OSRM."
        action={
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href={`/${params.role}/rides/${ride.id}`}>Trip sheet</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Map</CardTitle>
              <p className="text-sm text-muted-foreground">
                {ride.origin} → {ride.destination.replace(/\[[^\]]+\]/g, "").trim()}
              </p>
            </div>
            <RideStatusBadge status={ride.status} />
          </CardHeader>
          <CardContent>
            <LiveTrackingMap
              origin={originCoords}
              destination={ride.destinationCoords}
              driverPos={driverCoords}
              onRouteCalculated={(distKm) => {
                setDistanceRem(distKm);
                setTotalRoadDistance((prev) => {
                  if (prev === null) return distKm;
                  return prev;
                });
                const etaMin = Math.max(1, Math.round((distKm / 50) * 60));
                setEtaVal(etaMin);
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {driverCoords ? "Real-time ETA Progress" : "ETA progress (mock)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {driverCoords ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-semibold tracking-tight">
                      {etaVal !== null ? `${etaVal} min` : "Calculating..."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {distanceRem !== null ? `${distanceRem.toFixed(1)} km left` : "Calculating..."}
                    </p>
                  </div>
                  <Progress value={progressPercent} />
                  <div className="text-[11px] text-muted-foreground flex justify-between items-center">
                    <span>Progress: {progressPercent}%</span>
                    <div className="flex items-center gap-1">
                      {params.role === "driver" ? (
                        <>
                          <span className="truncate max-w-[150px]">
                            GPS: {driverCoords[0].toFixed(5)}, {driverCoords[1].toFixed(5)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-muted"
                            onClick={handleRecenter}
                            title="GPS Recenter"
                          >
                            <Navigation className="h-3 w-3 text-primary fill-current" />
                          </Button>
                        </>
                      ) : (
                        <span className="truncate max-w-[170px] text-primary">
                          Sync: {driverCoords[0].toFixed(5)}, {driverCoords[1].toFixed(5)}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-semibold tracking-tight">{eta}%</p>
                    <p className="text-xs text-muted-foreground">Waiting for driver location...</p>
                  </div>
                  <Progress value={eta} />
                  <Button
                    variant="secondary"
                    className="w-full rounded-xl"
                    onClick={() => setEta((v) => (v >= 95 ? 35 : v + 7))}
                  >
                    Simulate progress tick
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ride status timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <RideStatusTimeline status={ride.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emergency & safety</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full rounded-xl">
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Emergency contact (UI)
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>CampusRide safety desk (mock)</DialogTitle>
                    <DialogDescription>
                      In production this would dial UTeM security hotline and share live trip metadata.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                    <p className="font-semibold">UTeM 24/7 Security (example)</p>
                    <p className="mt-2 text-muted-foreground">+60 6-270 1000 (placeholder)</p>
                  </div>
                  <DialogFooter>
                    <Button className="rounded-xl" onClick={() => toast.success("Mock call sheet opened")}>
                      Copy details
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Separator />

              <Button variant="outline" className="w-full rounded-xl" onClick={() => toast.message("Calling driver (mock)")}>
                <PhoneCall className="mr-2 h-4 w-4" />
                Call driver (masked)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
