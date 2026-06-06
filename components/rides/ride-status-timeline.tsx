import type { RideStatus } from "@/types";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const order: RideStatus[] = ["Searching", "Confirmed", "Driver Arriving", "In Progress", "Completed"];

export function RideStatusTimeline({ status }: { status: RideStatus }) {
  const idx = order.indexOf(status);
  return (
    <ol className="relative space-y-4 pl-2">
      {order.map((step, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <li key={step} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full border text-xs font-semibold",
                  done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground",
                  active && "ring-4 ring-primary/15",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < order.length - 1 ? (
                <div className={cn("my-1 h-6 w-px", i < idx ? "bg-primary" : "bg-border")} aria-hidden />
              ) : null}
            </div>
            <div className="pt-1">
              <p className={cn("text-sm font-semibold", active ? "text-foreground" : "text-muted-foreground")}>{step}</p>
              <p className="text-xs text-muted-foreground">
                {step === "Searching" && "Matching riders around UTeM corridors."}
                {step === "Confirmed" && "Seats locked — chat opens for coordination."}
                {step === "Driver Arriving" && "Pickup window active — verify plate & colour."}
                {step === "In Progress" && "Live GPS simulation (mock) updates every few seconds."}
                {step === "Completed" && "Trip closed — fare split summary available."}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
