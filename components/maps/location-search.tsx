"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface LocationSearchProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  onSelect: (coords: [number, number], displayName: string) => void;
  placeholder?: string;
  className?: string;
}

export function LocationSearch({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
  className,
}: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (!value || value.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            value
          )}&format=json&limit=5&addressdetails=1`
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setSuggestions(data);
          setIsOpen(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Geocoding fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }, 600); // 600ms debounce to respect Nominatim rate limit

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {loading && (
        <span className="absolute right-3 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md backdrop-blur-md">
          {suggestions.map((item) => (
            <li
              key={item.place_id}
              onClick={() => {
                const lat = parseFloat(item.lat);
                const lon = parseFloat(item.lon);
                onSelect([lat, lon], item.display_name);
                setIsOpen(false);
              }}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
