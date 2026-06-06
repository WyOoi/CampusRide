"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PhoneCall, ShieldAlert } from "lucide-react";
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

export default function LiveTrackingPage() {
  const params = useParams<{ role: string; rideId: string }>();
  const ride = useMemo(() => getRideById(params.rideId), [params.rideId]);
  const [eta, setEta] = useState(62);

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
        description="OpenStreetMap with simulated driver updates — no websocket yet."
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
                {ride.origin} → {ride.destination}
              </p>
            </div>
            <RideStatusBadge status={ride.status} />
          </CardHeader>
          <CardContent>
            <LiveTrackingMap origin={ride.originCoords} destination={ride.destinationCoords} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ETA progress (mock)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-semibold tracking-tight">{eta}%</p>
                <p className="text-xs text-muted-foreground">Updates every few seconds</p>
              </div>
              <Progress value={eta} />
              <Button
                variant="secondary"
                className="w-full rounded-xl"
                onClick={() => setEta((v) => (v >= 95 ? 35 : v + 7))}
              >
                Simulate progress tick
              </Button>
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
