"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const RoutePreviewMap = dynamic(() => import("@/components/maps/route-preview-map").then((m) => m.RoutePreviewMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[260px] w-full rounded-2xl sm:h-[320px]" />,
});

const LiveTrackingMap = dynamic(() => import("@/components/maps/live-tracking-map").then((m) => m.LiveTrackingMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[320px] w-full rounded-2xl sm:h-[420px]" />,
});

export { RoutePreviewMap, LiveTrackingMap };
