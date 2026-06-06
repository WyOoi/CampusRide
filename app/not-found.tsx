import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">This route is not mapped yet</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        CampusRide is a frontend prototype — double-check the URL or head back home.
      </p>
      <Button asChild className="rounded-xl">
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          Back to landing
        </Link>
      </Button>
    </div>
  );
}
