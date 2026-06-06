import Link from "next/link";
import { APP_NAME, UNIVERSITY } from "@/lib/constants";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-sm font-semibold">{APP_NAME}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Peer-to-peer carpooling for {UNIVERSITY.short} students and staff — mock UI for prototype demos.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link className="hover:text-foreground" href="/find">
                Find rides
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/offer">
                Offer a ride
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/history">
                Ride history
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Trust & safety</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link className="hover:text-foreground" href="/verify-email">
                Email verification
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/admin">
                Moderator tools (demo)
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">University</p>
          <p className="mt-3 text-sm text-muted-foreground">{UNIVERSITY.full}</p>
          <p className="mt-1 text-sm text-muted-foreground">{UNIVERSITY.city}</p>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME} — Frontend prototype. No backend attached.
      </div>
    </footer>
  );
}
