"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap, Tooltip, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_CENTER } from "@/lib/constants";
import { Route } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom SVG icons for Leaflet markers
const createCustomIcon = (text: string, bgColor: string) => {
  if (typeof window === "undefined") return undefined;
  return L.divIcon({
    html: `<div class="flex flex-col items-center">
             <div class="h-8 w-8 rounded-full ${bgColor} border-2 border-white flex items-center justify-center shadow-lg text-white font-bold text-xs">
               ${text}
             </div>
             <div class="w-2 h-2 ${bgColor} rotate-45 -mt-1 shadow-md"></div>
           </div>`,
    className: "custom-div-icon",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

const originIcon = createCustomIcon("A", "bg-blue-600");
const destIcon = createCustomIcon("B", "bg-red-600");

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length < 2) return;
    map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
  }, [map, positions]);
  return null;
}

export function RoutePreviewMap({
  from,
  to,
  className,
  onRouteCalculated,
  onFromChange,
  onToChange,
  interactive = true,
}: {
  from: [number, number];
  to: [number, number];
  className?: string;
  onRouteCalculated?: (distanceKm: number) => void;
  onFromChange?: (coords: [number, number]) => void;
  onToChange?: (coords: [number, number]) => void;
  interactive?: boolean;
}) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([from, to]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const onRouteCalculatedRef = useRef(onRouteCalculated);
  useEffect(() => {
    onRouteCalculatedRef.current = onRouteCalculated;
  }, [onRouteCalculated]);

  useEffect(() => {
    if (!from || !to) return;

    let active = true;
    setLoading(true);

    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );
          const distKm = route.distance / 1000;

          setRouteCoords(coords);
          setDistanceKm(distKm);
          onRouteCalculatedRef.current?.(distKm);
        } else {
          console.error("OSRM Route request failed with code:", data.code);
          setRouteCoords([from, to]);
          setDistanceKm(null);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch OSRM route:", err);
        if (!active) return;
        setRouteCoords([from, to]);
        setDistanceKm(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [from, to]);

  const mapCenter = useMemo(() => {
    if (routeCoords.length > 0) {
      const lats = routeCoords.map((c) => c[0]);
      const lngs = routeCoords.map((c) => c[1]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      return [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number];
    }
    return MAP_CENTER;
  }, [routeCoords]);

  return (
    <div className={`relative ${className || ""}`}>
      {distanceKm !== null && !loading && (
        <div className="absolute right-3 top-3 z-[1000] flex items-center gap-1.5 rounded-xl border border-border bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md transition-all duration-300 shadow-md">
          <Route className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span>{distanceKm.toFixed(1)} km (road)</span>
        </div>
      )}
      {loading && (
        <div className="absolute right-3 top-3 z-[1000] flex items-center gap-1.5 rounded-xl border border-border bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md shadow-md">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Routing...</span>
        </div>
      )}
      <MapContainer
        center={mapCenter}
        zoom={13}
        className={cn(
          "w-full overflow-hidden border border-border",
          className ? "h-full rounded-none border-0" : "h-[260px] sm:h-[320px] rounded-2xl"
        )}
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        <FitBounds positions={routeCoords} />
        <Polyline positions={routeCoords} pathOptions={{ color: "#059669", weight: 4, opacity: 0.85 }} />
        {interactive ? (
          <Marker
            position={from}
            draggable={!!onFromChange}
            icon={originIcon}
            eventHandlers={{
              dragend(e) {
                const marker = e.target;
                if (marker != null) {
                  const latLng = marker.getLatLng();
                  onFromChange?.([latLng.lat, latLng.lng]);
                }
              },
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -35]} className="origin-tooltip">
              Origin {onFromChange ? "(Drag me!)" : ""}
            </Tooltip>
          </Marker>
        ) : (
          <CircleMarker center={from} radius={7} pathOptions={{ color: "#2563eb", fillColor: "#dbeafe", fillOpacity: 1 }}>
            <Tooltip permanent direction="top" offset={[0, -5]} className="origin-tooltip">
              Origin
            </Tooltip>
          </CircleMarker>
        )}

        {interactive ? (
          <Marker
            position={to as [number, number]}
            draggable={!!onToChange}
            icon={destIcon}
            eventHandlers={{
              dragend(e) {
                const marker = e.target;
                if (marker != null) {
                  const latLng = marker.getLatLng();
                  onToChange?.([latLng.lat, latLng.lng]);
                }
              },
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -35]} className="destination-tooltip">
              Destination {onToChange ? "(Drag me!)" : ""}
            </Tooltip>
          </Marker>
        ) : (
          <CircleMarker center={to as [number, number]} radius={7} pathOptions={{ color: "#dc2626", fillColor: "#fee2e2", fillOpacity: 1 }}>
            <Tooltip permanent direction="top" offset={[0, -5]} className="destination-tooltip">
              Destination
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
