"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function FollowDriver({
  position,
  route,
}: {
  position: [number, number];
  route: [number, number][];
}) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (!fitted.current && route.length >= 2) {
      map.fitBounds(L.latLngBounds(route), { padding: [48, 48] });
      fitted.current = true;
    }
  }, [map, route]);
  useEffect(() => {
    map.panTo(position, { animate: true });
  }, [map, position]);
  return null;
}

/** Interpolate along straight line for mock “GPS” updates */
function interpolate(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function LiveTrackingMap({
  origin,
  destination,
  className,
}: {
  origin: [number, number];
  destination: [number, number];
  className?: string;
}) {
  const route = useMemo(() => [origin, destination], [origin, destination]);
  const [t, setT] = useState(0.35);

  useEffect(() => {
    const id = window.setInterval(() => {
      setT((prev) => {
        const next = prev + 0.02;
        return next > 0.98 ? 0.2 : next;
      });
    }, 1600);
    return () => window.clearInterval(id);
  }, []);

  const driverPos = interpolate(origin, destination, t);

  return (
    <div className={className}>
      <MapContainer
        center={driverPos}
        zoom={13}
        className="h-[320px] w-full overflow-hidden rounded-2xl border border-border sm:h-[420px]"
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        <FollowDriver position={driverPos} route={route} />
        <Polyline positions={route} pathOptions={{ color: "#059669", weight: 4, opacity: 0.75, dashArray: "6 8" }} />
        <CircleMarker center={origin} radius={8} pathOptions={{ color: "#059669", fillColor: "#ecfdf5", fillOpacity: 1 }} />
        <CircleMarker
          center={destination}
          radius={8}
          pathOptions={{ color: "#0f172a", fillColor: "#e2e8f0", fillOpacity: 1 }}
        />
        <CircleMarker
          center={driverPos}
          radius={10}
          pathOptions={{ color: "#10b981", fillColor: "#34d399", fillOpacity: 0.95 }}
        />
      </MapContainer>
    </div>
  );
}
