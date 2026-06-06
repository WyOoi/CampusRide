"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

/** Mock cost-sharing estimator — linear model for UI demo only */
export function FareEstimate({ distanceKm, seats }: { distanceKm: number; seats: number }) {
  const { perSeat, total, toll } = useMemo(() => {
    const toll = distanceKm > 15 ? 2 : 0;
    const total = Math.max(4, Math.round(distanceKm * 0.55 + toll));
    const perSeat = Math.max(2, Math.round((total / Math.max(1, seats)) * 10) / 10);
    return { perSeat, total, toll };
  }, [distanceKm, seats]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fare estimator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Suggested per seat</p>
            <motion.p
              key={perSeat}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-semibold tracking-tight text-primary"
            >
              RM{perSeat.toFixed(1)}
            </motion.p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Trip total</p>
            <p className="text-sm font-semibold text-foreground">RM{total}</p>
            <p className="mt-1">Toll assumption: RM{toll}</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Sensitivity</Label>
          <Slider defaultValue={[55]} max={90} step={1} disabled aria-label="Fare sensitivity slider" />
        </div>
      </CardContent>
    </Card>
  );
}
