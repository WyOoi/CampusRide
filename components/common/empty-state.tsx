import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center"
    >
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? (
        <div className="mt-5">
          {action.href ? (
            <Button asChild className="rounded-xl">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button className="rounded-xl" type="button" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </motion.div>
  );
}
