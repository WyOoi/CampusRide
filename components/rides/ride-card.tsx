"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, MapPin, Star, Users, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { MockRide } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RideStatusBadge } from "@/components/rides/ride-status-badge";
import { formatDateTime } from "@/utils/format";
import { useRidesStore } from "@/store/rides-store";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useSessionStore } from "@/store/session-store";
export function RideCard({ ride, href }: { ride: MockRide; href?: string }) {
  const { joinedRideIds, joinRide } = useRidesStore();
  const [isJoining, setIsJoining] = useState(false);
  const params = useParams<{ role?: string }>();
  const { activeRole } = useSessionStore();

  const currentRole = params?.role === "both" ? activeRole : (params?.role || activeRole);
  const isPassenger = currentRole === "passenger";
  const target = href ?? `/${currentRole}/rides/${ride.id}`;

  const isJoined = joinedRideIds.includes(ride.id);
  const isFull = ride.seatsAvailable === 0;

  const handleJoinClick = () => {
    setIsJoining(true);
    setTimeout(() => {
      const success = joinRide(ride.id);
      setIsJoining(false);
      if (success) {
        toast.success(`Successfully joined ${ride.driverName}'s ride!`, {
          description: `${ride.origin.split("—")[0].trim()} → ${ride.destination.split("—")[0].trim()}`,
        });
      } else {
        toast.error("Failed to join ride");
      }
    }, 600);
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01, boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.3)" }}
      transition={{ type: "spring", stiffness: 360, damping: 26 }}
    >
      <Card className="overflow-hidden border border-border/40 bg-card/60 backdrop-blur-md transition-all duration-300">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <RideStatusBadge status={ride.status} />
              <span className="text-xs text-muted-foreground">#{ride.id.toUpperCase()}</span>
            </div>
            <div className="space-y-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{ride.origin}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{ride.destination}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{ride.driverName}</span>
                <span className="mx-2">•</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-chart-4" />
                  {ride.driverRating.toFixed(1)}
                </span>
                <span className="mx-2">•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDateTime(ride.departureISO)}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-foreground transition-all duration-300">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={ride.seatsAvailable}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="font-bold text-foreground"
                  >
                    {ride.seatsAvailable}
                  </motion.span>
                </AnimatePresence>
                <span>/</span>
                <span>{ride.seatsTotal} seats</span>
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">{ride.distanceKm} km</span>
              <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">ETA {ride.etaMinutes} min</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                RM{ride.pricePerSeatMYR}/seat
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end w-full sm:w-[130px]">
            {isPassenger && (
              isJoined ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full"
                >
                  <Button
                    type="button"
                    disabled
                    className="w-full rounded-xl bg-blue-600 text-white disabled:opacity-100 flex items-center justify-center gap-1.5 shadow-sm font-semibold border-none"
                  >
                    <Check className="h-4 w-4" />
                    Joined
                  </Button>
                </motion.div>
              ) : isFull ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full"
                >
                  <Button
                    type="button"
                    disabled
                    variant="outline"
                    className="w-full rounded-xl opacity-60 cursor-not-allowed font-semibold text-muted-foreground bg-muted/40"
                  >
                    Full
                  </Button>
                </motion.div>
              ) : (
                <Button
                  type="button"
                  disabled={isJoining}
                  className="w-full rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
                  onClick={handleJoinClick}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Ride"
                  )}
                </Button>
              )
            )}
            <div className="flex gap-2 w-full">
              <Button asChild variant="secondary" className="flex-1 rounded-xl">
                <Link href={target}>{ride.status === "Searching" ? "View" : "Details"}</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 rounded-xl">
                <Link href={`/${currentRole}/tracking/${ride.id}`}>Track</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

