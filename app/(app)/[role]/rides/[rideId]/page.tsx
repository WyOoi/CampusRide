"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { MessageCircle, Route } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RideStatusBadge } from "@/components/rides/ride-status-badge";
import { RoutePreviewMap } from "@/components/maps/dynamic-maps";
import { getRideById } from "@/data/mock-rides";
import { mockUsers } from "@/data/mock-users";
import { formatDateTime } from "@/utils/format";

const chatMock = [
  { who: "Driver", text: "I’m in a dark blue Myvi — hazard lights on near SRC A.", time: "08:12" },
  { who: "You", text: "Noted! In grey hoodie, two seats.", time: "08:13" },
  { who: "Driver", text: "Great, rolling in ~6 mins.", time: "08:14" },
];

export default function RideDetailsPage() {
  const params = useParams<{ role: string; rideId: string }>();
  const ride = useMemo(() => getRideById(params.rideId), [params.rideId]);

  if (!ride) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ride details" description="That ride ID is not in the mock dataset." />
        <ErrorState
          action={
            <Button asChild className="rounded-xl">
              <Link href={`/${params.role}/find`}>Back to search</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const passengers = mockUsers.filter((u) => u.id !== ride.driverId).slice(0, 2);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Trip details"
        description={`${ride.origin} → ${ride.destination}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" className="rounded-xl">
              <Link href={`/${params.role}/tracking/${ride.id}`}>
                <Route className="mr-2 h-4 w-4" />
                Live tracking
              </Link>
            </Button>
            <Button className="rounded-xl">
              <MessageCircle className="mr-2 h-4 w-4" />
              Open chat
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <RideStatusBadge status={ride.status} />
        <span className="text-sm text-muted-foreground">
          Departs <span className="font-medium text-foreground">{formatDateTime(ride.departureISO)}</span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Route visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <RoutePreviewMap from={ride.originCoords} to={ride.destinationCoords} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Chat (mock)</CardTitle>
              <span className="text-xs text-muted-foreground">End-to-end encryption label — UI only</span>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[260px] rounded-2xl border border-border bg-muted/20 p-4">
                <div className="space-y-3">
                  {chatMock.map((m, idx) => (
                    <div
                      key={idx}
                      className={m.who === "You" ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-primary-foreground" : "mr-auto max-w-[85%] rounded-2xl bg-background px-3 py-2"}
                    >
                      <p className="text-[11px] font-semibold opacity-80">
                        {m.who} · {m.time}
                      </p>
                      <p className="mt-1 text-sm">{m.text}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Driver</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{ride.driverName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{ride.driverName}</p>
                <p className="text-sm text-muted-foreground">{ride.vehicle}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Passengers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {passengers.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.faculty}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fare breakdown (mock)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base share</span>
                <span className="font-medium">RM{ride.pricePerSeatMYR}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform fee</span>
                <span className="font-medium">RM0</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>RM{ride.pricePerSeatMYR}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
