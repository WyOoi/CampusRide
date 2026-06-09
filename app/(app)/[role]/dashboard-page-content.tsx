"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CarFront,
  ClipboardList,
  Search,
  LogOut,
  Car,
  Wallet,
  Banknote,
  ShieldCheck,
} from "lucide-react";
import { useSessionStore } from "@/store/session-store";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/utils/format";
import type { UserRole } from "@/types";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { useRouter, useParams } from "next/navigation";

export function parseRideDestination(destStr: string) {
  if (!destStr) return { destination: "", paymentMethod: "cash", rideState: "active" };
  let paymentMethod = "cash";
  const payMatch = destStr.match(/\[payment_method:([^\]]+)\]/);
  if (payMatch) paymentMethod = payMatch[1].trim();
  let rideState = "active";
  const stateMatch = destStr.match(/\[ride_state:([^\]]+)\]/);
  if (stateMatch) rideState = stateMatch[1].trim();
  const cleanDest = destStr.replace(/\[[^\]]+\]/g, "").trim();
  return { destination: cleanDest, paymentMethod, rideState };
}

export default function DashboardPage() {
  const { activeRole, setActiveRole } = useSessionStore();
  const router = useRouter();
  const params = useParams<{ role: string }>();
  
  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("isAdmin");
    }
    await supabase.auth.signOut();
    router.push("/login");
  };

  const [fullName, setFullName] = useState("Student");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [alerts, setAlerts] = useState<any[]>([]);

  const [ongoingData, setOngoingData] = useState<{
    passengerBookings: any[];
    passengerRequests: any[];
    pendingPaymentPassengerBookings: any[];
    driverRides: any[];
    driverRequests: any[];
  }>({
    passengerBookings: [],
    passengerRequests: [],
    pendingPaymentPassengerBookings: [],
    driverRides: [],
    driverRequests: [],
  });

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (typeof window !== "undefined" && sessionStorage.getItem("isAdmin") === "true") {
          setFullName("Admin User");
          setEmail("admin");
          setRole("Admin");
          return;
        }
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name);
        setEmail(profile.email);
        setRole(
          profile.role.charAt(0).toUpperCase() +
          profile.role.slice(1)
        );
      }

      const { data: alertsData } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4);
      if (alertsData) setAlerts(alertsData);

      try {
        // Passenger data
        const { data: activeBookings } = await supabase
          .from("bookings")
          .select(`*, rides (*)`)
          .eq("passenger_id", user.id)
          .in("booking_status", ["pending", "confirmed"])
          .order("created_at", { ascending: false });

        const ongoingPassengerBookings = (activeBookings || []).filter((b: any) => {
          const destStr = b.rides?.destination || "";
          return destStr.includes("[ride_state:in_progress]");
        });

        const pendingPaymentPassengerBookings = (activeBookings || []).filter((b: any) => {
          const isCompleted = b.rides?.status === "completed" || b.rides?.status === "closed";
          return isCompleted && b.booking_status === "confirmed";
        });

        const { data: activeReqs } = await supabase
          .from("ride_requests")
          .select("*")
          .eq("passenger_id", user.id)
          .in("status", ["open", "accepted"]);

        const ongoingPassengerRequests = (activeReqs || []).filter((r: any) => {
          return r.destination?.includes("[ride_state:in_progress]");
        });

        // Driver data
        const { data: activeRides } = await supabase
          .from("rides")
          .select("*")
          .eq("driver_id", user.id)
          .eq("status", "active");

        const ongoingDriverRides = (activeRides || []).filter((r: any) => {
          return r.destination?.includes("[ride_state:in_progress]");
        });

        const { data: driverReqs } = await supabase
          .from("ride_requests")
          .select("*")
          .eq("accepted_driver_id", user.id)
          .eq("status", "accepted");

        const ongoingDriverRequests = (driverReqs || []).filter((r: any) => {
          return r.destination?.includes("[ride_state:in_progress]");
        });

        setOngoingData({
          passengerBookings: ongoingPassengerBookings,
          passengerRequests: ongoingPassengerRequests,
          pendingPaymentPassengerBookings: pendingPaymentPassengerBookings,
          driverRides: ongoingDriverRides,
          driverRequests: ongoingDriverRequests
        });
      } catch (e) {
        console.error(e);
      }
      
      const channel = supabase
        .channel(`dashboard-alerts-${Date.now()}-${Math.random()}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "alerts" },
          (payload) => {
            if ((payload.new as any).user_id === user.id) {
              setAlerts((prev) => {
                const newAlert = payload.new as any;
                if (prev.some(a => a.id === newAlert.id)) return prev;
                return [newAlert, ...prev].slice(0, 4);
              });
            }
          }
        )
        .subscribe();
        
      return channel;
    };

    let channel: any;
    loadUser().then(ch => channel = ch);
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  const firstName = fullName.split(" ")[0];
  const hasOngoingPassenger = ongoingData.passengerBookings.length > 0 || ongoingData.passengerRequests.length > 0 || ongoingData.pendingPaymentPassengerBookings.length > 0;
  const hasOngoingDriver = ongoingData.driverRides.length > 0 || ongoingData.driverRequests.length > 0;

  const renderOngoingCard = (id: string, pickup: string, dropoff: string, statusText: string, seats: number, paymentMethod: string, currentRole: string) => (
    <div key={id} className="flex flex-col gap-3 border border-gray-700/50 bg-[#1a1c23] p-4 rounded-2xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="bg-red-500/20 p-1.5 rounded-full shrink-0">
              <Car className="text-red-500 animate-pulse" size={14} />
            </div>
            <h3 className="font-semibold text-white text-sm">Ongoing Active Trip</h3>
          </div>
          <p className="text-sm font-medium text-white">{pickup || "Unknown"} → {dropoff || "Unknown"}</p>
        </div>
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 whitespace-nowrap text-[10px]">
          {statusText}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mt-1">
        <div>
          <p>Passenger Seats:</p>
          <p className="font-medium text-white">{seats || 1}</p>
        </div>
        <div>
          <p>Payment:</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Wallet className="h-3 w-3" />
            <span className="font-medium text-white capitalize">{paymentMethod}</span>
          </div>
        </div>
      </div>

      <Button asChild size="sm" className="w-full mt-1 rounded-xl bg-white text-black hover:bg-gray-200">
        <Link href={`/${currentRole}/orders`}>View details</Link>
      </Button>
    </div>
  );

  return (
    <div className="space-y-8 pb-8 text-white w-full max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#12141c] border border-gray-800 rounded-[2rem] p-6 md:p-8 flex justify-between items-start">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold mb-1 text-cyan-400 shadow-cyan-500/20 drop-shadow-[0_0_12px_rgba(34,211,238,0.3)]`}>
            Good afternoon, {firstName} 👋
          </h1>
          <p className="text-sm md:text-base opacity-90 text-gray-400 font-medium">{role || (params?.role ? params.role.charAt(0).toUpperCase() + params.role.slice(1) : "")}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-cyan-400"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Request/Offer Ride */}
        <Link href={params?.role === "passenger" ? "/passenger/request-ride" : "/driver/offer"} className="block">
          <div className="bg-[#12141c] border border-gray-800 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800/80 transition-colors h-[140px]">
            <div className="bg-[#1c2235] p-4 rounded-full mb-3">
              <CarFront className="text-[#5B7BFB]" size={24} />
            </div>
            <span className="font-semibold text-white">
              {params?.role === "passenger" ? "Request Ride" : "Offer Ride"}
            </span>
          </div>
        </Link>

        {/* Find Ride */}
        <Link href="/find" className="block">
          <div className="bg-[#12141c] border border-gray-800 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800/80 transition-colors h-[140px]">
            <div className="bg-[#2a261a] p-4 rounded-full mb-3">
              <Search className="text-[#eab308]" size={24} />
            </div>
            <span className="font-semibold text-white">Find Ride</span>
          </div>
        </Link>

        {/* My Orders */}
        <Link href="/orders" className="block h-full">
          <div className="bg-[#12141c] border border-gray-800 rounded-3xl p-6 flex flex-col justify-center cursor-pointer hover:bg-gray-800/80 transition-colors h-[140px]">
            <div className="flex items-center gap-4">
              <div className="bg-[#2a2b36] p-4 rounded-full shrink-0">
                <ClipboardList className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">My Orders</h3>
                <p className="text-xs text-gray-400">View your recent and upcoming trips</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Active Trips Section */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Active Trips</h2>
          
          {(params?.role === "passenger" ? hasOngoingPassenger : hasOngoingDriver) ? (
            <div className="bg-[#12141c] border border-gray-800 rounded-3xl p-6 space-y-4 h-[250px] overflow-y-auto">
              {params?.role === "passenger" && (
                <>
                  {ongoingData.passengerBookings.map((b) => {
                    const { destination, paymentMethod } = parseRideDestination(b.rides?.destination);
                    return renderOngoingCard(b.id, b.rides?.pickup_location, destination, "In Transit", b.rides?.available_seats || 1, paymentMethod, "passenger");
                  })}
                  {ongoingData.passengerRequests.map((r) => {
                    const { destination, paymentMethod } = parseRideDestination(r.destination);
                    return renderOngoingCard(r.id, r.pickup_location, destination, "In Transit", r.seats_needed, paymentMethod, "passenger");
                  })}
                  {ongoingData.pendingPaymentPassengerBookings.map((b) => {
                    const { destination, paymentMethod } = parseRideDestination(b.rides?.destination);
                    return renderOngoingCard(b.id, b.rides?.pickup_location, destination, "Pending Payment", b.rides?.available_seats || 1, paymentMethod, "passenger");
                  })}
                </>
              )}
              {params?.role === "driver" && (
                <>
                  {ongoingData.driverRides.map((r) => {
                    const { destination, paymentMethod } = parseRideDestination(r.destination);
                    return renderOngoingCard(r.id, r.pickup_location, destination, "Driving", r.available_seats, paymentMethod, "driver");
                  })}
                  {ongoingData.driverRequests.map((r) => {
                    const { destination, paymentMethod } = parseRideDestination(r.destination);
                    return renderOngoingCard(r.id, r.pickup_location, destination, "Driving", r.seats_needed, paymentMethod, "driver");
                  })}
                </>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-gray-700 rounded-3xl p-8 flex flex-col items-center justify-center text-center h-[200px]">
              <div className="bg-[#2a2b36] p-4 rounded-full mb-4">
                <CarFront className="text-gray-400" size={24} />
              </div>
              <h3 className="text-white font-semibold mb-2">No active trips</h3>
              <p className="text-sm text-gray-400 max-w-[200px]">You don't have any ongoing rides. Ready to go somewhere?</p>
            </div>
          )}
        </div>

        {/* Notifications Section */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Notifications</h2>
          <div className="bg-[#12141c] border border-gray-800 rounded-3xl flex flex-col overflow-hidden h-[200px]">
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center border-b border-gray-800 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-sm text-gray-400">All caught up! No recent notifications.</p>
              ) : (
                <div className="space-y-3 w-full">
                  {alerts.map((n, idx) => (
                    <div key={n.id} className="text-left w-full border-b border-gray-800 pb-2">
                      <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                      <p className="text-xs text-gray-400 truncate">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link href={`/${params?.role || "passenger"}/notifications`} className="block">
              <div className="p-4 text-center cursor-pointer hover:bg-gray-800 transition-colors">
                <span className="text-[#5B7BFB] text-sm font-semibold">View all notifications</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
