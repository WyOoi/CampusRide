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
  driverPos: propDriverPos,
  onRouteCalculated,
  className,
}: {
  origin: [number, number];
  destination: [number, number];
  driverPos?: [number, number];
  onRouteCalculated?: (distanceKm: number) => void;
  className?: string;
}) {
  const [fullRouteCoords, setFullRouteCoords] = useState<[number, number][]>([origin, destination]);
  const [t, setT] = useState(0.35);

  const onRouteCalculatedRef = useRef(onRouteCalculated);
  useEffect(() => {
    onRouteCalculatedRef.current = onRouteCalculated;
  }, [onRouteCalculated]);

  // 1. Fetch full road route from origin to destination for display
  useEffect(() => {
    if (!origin || !destination) return;
    const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );
          setFullRouteCoords(coords);
          
          // If no live driver position, trigger the total distance
          if (!propDriverPos) {
            onRouteCalculatedRef.current?.(data.routes[0].distance / 1000);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch full OSRM route:", err));
  }, [origin, destination, propDriverPos]);

  // 2. Fetch remaining road distance from driver position to destination
  useEffect(() => {
    if (!propDriverPos || !destination) return;
    const url = `https://router.project-osrm.org/route/v1/driving/${propDriverPos[1]},${propDriverPos[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const distKm = data.routes[0].distance / 1000;
          onRouteCalculatedRef.current?.(distKm);
        }
      })
      .catch((err) => console.error("Failed to fetch remaining OSRM route:", err));
  }, [propDriverPos, destination]);

  // 3. Mock interpolation when no live driverPos
  useEffect(() => {
    if (propDriverPos) return;
    const id = window.setInterval(() => {
      setT((prev) => {
        const next = prev + 0.02;
        return next > 0.98 ? 0.2 : next;
      });
    }, 1600);
    return () => window.clearInterval(id);
  }, [propDriverPos]);

  const driverPos = propDriverPos || interpolate(origin, destination, t);

  return (
    <div className={className}>
      <MapContainer
        center={driverPos}
        zoom={13}
        className="h-[320px] w-full overflow-hidden rounded-2xl border border-border sm:h-[420px]"
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        <FollowDriver position={driverPos} route={fullRouteCoords} />
        <Polyline positions={fullRouteCoords} pathOptions={{ color: "#059669", weight: 4, opacity: 0.85 }} />
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
