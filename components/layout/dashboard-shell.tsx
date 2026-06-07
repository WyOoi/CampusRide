"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner"; 
import {
  Bell,
  CarFront,
  Gauge,
  ClipboardList,
  LayoutDashboard,
  Search,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { APP_NAME } from "@/lib/constants";

const nav = [
  { href: "", label: "Home", icon: LayoutDashboard },
  { href: "/find", label: "Find", icon: Search },
  { href: "/requests", label: "Find Requests", icon: Search },
  { href: "/offer", label: "Offer Ride", icon: CarFront },
  { href: "/request-ride", label: "Request Ride", icon: Search },
  { href: "/orders", label: "Orders", icon: ClipboardList },

  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppSidebar({ className, variant = "desktop" }: { className?: string; variant?: "desktop" | "drawer" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
  setMounted(true);
}, []);
const [userId, setUserId] = useState<string | null>(null);
const [role, setRole] = useState<string | null>(null);
const [hasActiveRequest, setHasActiveRequest] =
  useState(false);
  useEffect(() => {
    const channel = supabase
      .channel("global-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },
        async (payload) => {
          const audio = new Audio("/sounds/notification.mp3");
          audio.play().catch(console.error);

if (
  userId &&
  (payload.new as any).user_id === userId
) {
  setUnreadCount((prev) => prev + 1);


toast(
  (payload.new as any).title || "New Notification",
  {
    description:
      (payload.new as any).message || "",

  }
);
}
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
const loadUnreadCount = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (typeof window !== "undefined" && sessionStorage.getItem("isAdmin") === "true") {
      setRole("admin");
    }
    return;
  }

  setUserId(user.id);
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

setRole(profile?.role || null);
if (profile?.role === "passenger") {
  const { data: requests } =
    await supabase
      .from("ride_requests")
      .select("id")
      .eq("passenger_id", user.id)
      .in("status", [
        "open",
        "accepted",
      ])
      .limit(1);

  setHasActiveRequest(
    !!requests &&
      requests.length > 0
  );
}
  const { count } = await supabase
    .from("alerts")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("user_id", user.id)
    .eq("is_read", false);

  setUnreadCount(count || 0);
};
useEffect(() => {
  loadUnreadCount();

  const handleRead = () => {
    loadUnreadCount();
  };

  window.addEventListener(
    "notifications-read",
    handleRead
  );

  return () => {
    window.removeEventListener(
      "notifications-read",
      handleRead
    );
  };
}, []);
  return (
    <aside
      className={cn(
        variant === "desktop" && "hidden w-64 shrink-0 border-r border-border bg-card/40 md:flex md:flex-col",
        variant === "drawer" && "flex w-full flex-col border-0 bg-transparent",
        className,
      )}
    >
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
          CR
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">{APP_NAME}</p>
          <p className="text-[11px] text-muted-foreground">UTeM carpool</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map((item) => {
          if (
            role !== "driver" &&
            (item.href === "/offer" || item.href === "/requests")
          ) {
            return null;
          }
          if (
            role !== "passenger" &&
            (item.href === "/find" || item.href === "/request-ride")
          ) {
            return null;
          }

            const href = role ? `/${role}${item.href}` : item.href;
            const active = pathname === href || (item.href !== "" && pathname.startsWith(`${href}/`));
            const Icon = item.icon;
            const label = item.href === "/requests"
              ? (role === "driver" ? "Find Request" : "My Requests")
              : item.label;
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />

                <span className="flex items-center gap-2">
                  {label}

                  {mounted &&
                    item.href === "/notifications" &&
                    unreadCount > 0 && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                        {unreadCount}
                      </span>
                    )}
                </span>
              </Link>
            );
        })}
      </nav>
      <div className="p-3 mt-auto space-y-3">
        <div className="flex items-center justify-between px-3 py-2 rounded-2xl border border-border bg-card/60">
          <span className="text-xs font-semibold text-muted-foreground">Dark mode</span>
          <ThemeToggle />
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground">
            <Gauge className="h-4 w-4 text-primary" />
            <span className="font-semibold">Live status</span>
          </div>
          <p className="mt-2">Mock GPS + matching — connect a backend later for real-time updates.</p>
        </div>
      </div>
    </aside>
  );
}

export function MobileBottomNav(
  
) {
  const [role, setRole] =
  useState<string | null>(null);

useEffect(() => {
  const loadRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (typeof window !== "undefined" && sessionStorage.getItem("isAdmin") === "true") {
        setRole("admin");
      }
      return;
    }

    const { data } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    setRole(data?.role || null);
  };

  loadRole();
}, []);
  const pathname = usePathname();
const primary = nav.filter((n) => {
  if (
    role !== "driver" &&
    (n.href === "/offer" || n.href === "/requests")
  )
    return false;

  if (
    role !== "passenger" &&
    (n.href === "/find" || n.href === "/request-ride")
  )
    return false;

  return [
    "",
    "/find",
    "/requests",
    "/offer",
    "/request-ride",
    "/orders",
    "/notifications",
    "/profile",
  ].includes(n.href);
});
  const isFullScreenMapPage = pathname.endsWith("/offer") || pathname.endsWith("/request-ride");
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur",
      !isFullScreenMapPage && "md:hidden"
    )}>
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {primary.map((item) => {
          const href = role ? `/${role}${item.href}` : item.href;
          const active = pathname === href || (item.href !== "" && pathname.startsWith(`${href}/`));
          const Icon = item.icon;
          const label = item.href === "/requests"
            ? (role === "driver" ? "Find Request" : "My Requests")
            : item.label;
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex min-w-[64px] flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium text-center leading-tight",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-2xl border",
                  active ? "border-primary/30 bg-primary/10" : "border-transparent bg-muted/40",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="w-full text-center">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (typeof window !== "undefined" && sessionStorage.getItem("isAdmin") === "true") {
          setRole("admin");
          return;
        }
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setRole(data?.role || null);
    };

    checkRole();
  }, [router]);

  useEffect(() => {
    if (!role) return;

    const pathParts = pathname.split("/");
    const pathRole = pathParts[1]; // e.g. "passenger", "driver", "admin"

    if (pathRole !== "passenger" && pathRole !== "driver" && pathRole !== "admin") {
      let targetPath = pathname;
      if (targetPath === "/dashboard") {
        targetPath = "";
      } else if (targetPath.startsWith("/dashboard/")) {
        targetPath = targetPath.substring(10);
      }
      router.push(`/${role}${targetPath}`);
      return;
    } else if (pathRole !== role) {
      router.push(`/${role}`);
      return;
    }

    const page = pathParts[2]; // e.g. "find", "requests", etc.
    if (role === "driver" && (page === "find" || page === "request-ride")) {
      router.push("/driver");
    }
    if (role === "passenger" && (page === "offer" || page === "requests")) {
      router.push("/passenger/orders");
    }
    if (role === "admin" && (page === "find" || page === "requests" || page === "offer" || page === "request-ride" || page === "orders")) {
      router.push("/admin");
    }
  }, [role, pathname, router]);

  const isFullScreenMapPage = pathname.endsWith("/offer") || pathname.endsWith("/request-ride");

  return (
    <div className="flex min-h-dvh bg-background">
      {!isFullScreenMapPage && <AppSidebar />}
      <div className={cn("flex min-w-0 flex-1 flex-col", !isFullScreenMapPage && "pb-24 md:pb-0")}>
        <main className={cn(
          isFullScreenMapPage ? "m-0 p-0 h-[calc(100dvh-76px)] w-full overflow-hidden relative" : "mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6"
        )}>
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
