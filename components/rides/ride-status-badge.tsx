import type { RideStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<RideStatus, string> = {
  Searching: "bg-chart-2/15 text-chart-2 border-chart-2/20",
  Confirmed: "bg-primary/15 text-primary border-primary/20",
  "Driver Arriving": "bg-chart-4/15 text-chart-4 border-chart-4/20",
  "In Progress": "bg-chart-3/15 text-chart-3 border-chart-3/20",
  Completed: "bg-muted text-muted-foreground border-border",
};

export function RideStatusBadge({ status, className }: { status: RideStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full border font-medium", styles[status], className)}>
      {status}
    </Badge>
  );
}
