"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/utils/format";
import {
  Plus,
  Trash2,
  Search,
  Users as UsersIcon,
  Car as CarIcon,
  ClipboardList as ClipboardIcon,
  FileText as FileTextIcon,
  Calendar,
  MapPin,
  Wallet
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";

type TabType = "profiles" | "rides" | "bookings" | "requests";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profiles");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Database State
  const [profiles, setProfiles] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  // Dialog State
  const [activeModal, setActiveModal] = useState<TabType | null>(null);

  // Form States
  const [profileForm, setProfileForm] = useState({
    email: "",
    full_name: "",
    role: "passenger",
    vehicle_model: "",
    vehicle_color: "",
    vehicle_plate: "",
  });

  const [rideForm, setRideForm] = useState({
    driver_id: "",
    pickup_location: "",
    destination: "",
    departure_time: "",
    available_seats: 4,
    cost_per_person: 5.0,
    status: "active",
  });

  const [bookingForm, setBookingForm] = useState({
    passenger_id: "",
    ride_id: "",
    booking_status: "pending",
  });

  const [requestForm, setRequestForm] = useState({
    passenger_id: "",
    pickup_location: "",
    destination: "",
    departure_time: "",
    seats_needed: 1,
    status: "open",
  });

  // Fetch all database tables
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: profilesData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: ridesData } = await supabase.from("rides").select("*, profiles!rides_driver_id_fkey(*)").order("created_at", { ascending: false });
      const { data: bookingsData } = await supabase.from("bookings").select("*, profiles!bookings_passenger_id_fkey(*), rides(*)").order("created_at", { ascending: false });
      const { data: requestsData } = await supabase.from("ride_requests").select("*, profiles!ride_requests_passenger_id_fkey(*)").order("created_at", { ascending: false });

      if (profilesData) setProfiles(profilesData);
      if (ridesData) setRides(ridesData);
      if (bookingsData) setBookings(bookingsData);
      if (requestsData) setRequests(requestsData);
    } catch (error: any) {
      console.error("Error loading database records:", error);
      toast.error("Failed to load records: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Growth Data dynamically
  const userGrowth = useMemo(() => {
    if (profiles.length === 0) return [{ week: "W1", users: 0 }];
    const sorted = [...profiles].sort((a, b) => new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime());
    const step = Math.ceil(sorted.length / 5);
    return Array.from({ length: 5 }).map((_, i) => {
      const idx = Math.min((i + 1) * step, sorted.length);
      return {
        week: `P${i + 1}`,
        users: idx,
      };
    });
  }, [profiles]);

  // Compute Ride Volume dynamically
  const rideVolume = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    rides.forEach((r) => {
      const dayIdx = new Date(r.departure_time || "").getDay();
      counts[dayIdx]++;
    });
    return days.map((day, idx) => ({
      day,
      rides: counts[idx] || 0,
    }));
  }, [rides]);

  // Delete Handlers
  const handleDelete = async (table: string, id: string) => {
    if (!confirm(`Are you sure you want to delete this record from ${table}?`)) return;

    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      toast.success("Record deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(`Error deleting: ${error.message}`);
    }
  };

  // Add Handlers
  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.email || !profileForm.full_name) {
      toast.error("Please fill in email and full name.");
      return;
    }
    try {
      const newId = crypto.randomUUID();
      const { error } = await supabase.from("profiles").insert({
        id: newId,
        email: profileForm.email,
        full_name: profileForm.full_name,
        role: profileForm.role,
        vehicle_model: profileForm.role === "driver" ? profileForm.vehicle_model : null,
        vehicle_color: profileForm.role === "driver" ? profileForm.vehicle_color : null,
        vehicle_plate: profileForm.role === "driver" ? profileForm.vehicle_plate : null,
      });

      if (error) throw error;
      toast.success("Profile created successfully");
      setActiveModal(null);
      setProfileForm({
        email: "",
        full_name: "",
        role: "passenger",
        vehicle_model: "",
        vehicle_color: "",
        vehicle_plate: "",
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rideForm.driver_id || !rideForm.pickup_location || !rideForm.destination || !rideForm.departure_time) {
      toast.error("Please fill in driver, pickup, destination, and departure time.");
      return;
    }
    try {
      const { error } = await supabase.from("rides").insert({
        driver_id: rideForm.driver_id,
        pickup_location: rideForm.pickup_location,
        destination: rideForm.destination,
        departure_time: new Date(rideForm.departure_time).toISOString(),
        available_seats: Number(rideForm.available_seats),
        cost_per_person: Number(rideForm.cost_per_person),
        status: rideForm.status,
      });

      if (error) throw error;
      toast.success("Ride created successfully");
      setActiveModal(null);
      setRideForm({
        driver_id: "",
        pickup_location: "",
        destination: "",
        departure_time: "",
        available_seats: 4,
        cost_per_person: 5.0,
        status: "active",
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.passenger_id || !bookingForm.ride_id) {
      toast.error("Please fill in passenger and ride.");
      return;
    }
    try {
      const { error } = await supabase.from("bookings").insert({
        passenger_id: bookingForm.passenger_id,
        ride_id: bookingForm.ride_id,
        booking_status: bookingForm.booking_status,
      });

      if (error) throw error;
      toast.success("Booking created successfully");
      setActiveModal(null);
      setBookingForm({
        passenger_id: "",
        ride_id: "",
        booking_status: "pending",
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.passenger_id || !requestForm.pickup_location || !requestForm.destination || !requestForm.departure_time) {
      toast.error("Please fill in passenger, pickup, destination, and departure time.");
      return;
    }
    try {
      const { error } = await supabase.from("ride_requests").insert({
        passenger_id: requestForm.passenger_id,
        pickup_location: requestForm.pickup_location,
        destination: requestForm.destination,
        departure_time: new Date(requestForm.departure_time).toISOString(),
        seats_needed: Number(requestForm.seats_needed),
        status: requestForm.status,
      });

      if (error) throw error;
      toast.success("Ride request created successfully");
      setActiveModal(null);
      setRequestForm({
        passenger_id: "",
        pickup_location: "",
        destination: "",
        departure_time: "",
        seats_needed: 1,
        status: "open",
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Filters
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) =>
      `${p.full_name} ${p.email} ${p.role}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [profiles, searchQuery]);

  const filteredRides = useMemo(() => {
    return rides.filter((r) =>
      `${r.pickup_location} ${r.destination} ${r.profiles?.full_name || ""}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rides, searchQuery]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) =>
      `${b.profiles?.full_name || ""} ${b.rides?.pickup_location || ""} ${b.rides?.destination || ""}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [bookings, searchQuery]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) =>
      `${req.profiles?.full_name || ""} ${req.pickup_location} ${req.destination}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [requests, searchQuery]);

  return (
    <div className="space-y-8 pb-8 text-white w-full max-w-6xl mx-auto">
      <PageHeader
        title="Moderator Dashboard"
        description="Cockpit to inspect and manage profiles, active carpools, passenger requests, and seat bookings live."
      />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Accounts", value: loading ? "..." : profiles.length, hint: "Registered users in system", icon: UsersIcon, color: "text-emerald-400" },
          { label: "Active Carpools", value: loading ? "..." : rides.filter(r => r.status === "active").length, hint: "Rides currently active", icon: CarIcon, color: "text-cyan-400" },
          { label: "Ride Bookings", value: loading ? "..." : bookings.length, hint: "Confirmed and pending seats", icon: ClipboardIcon, color: "text-violet-400" },
          { label: "Open Requests", value: loading ? "..." : requests.filter(r => r.status === "open").length, hint: "Passengers looking for drivers", icon: FileTextIcon, color: "text-amber-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-[#12141c] border-gray-800 rounded-2xl overflow-hidden relative group">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-400">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight text-white">{s.value}</p>
              <p className="mt-1.5 text-xs text-gray-500">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-[#12141c] border-gray-800 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base text-white">Cumulative User Signups</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-white/10" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#334155",
                    background: "#0f172a",
                    color: "#f1f5f9"
                  }}
                />
                <Area type="monotone" dataKey="users" stroke="#10b981" fill="url(#fillUsers)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#12141c] border-gray-800 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base text-white">Carpool Offers By Weekday</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rideVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-white/10" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#334155",
                    background: "#0f172a",
                    color: "#f1f5f9"
                  }}
                />
                <Bar dataKey="rides" fill="#38bdf8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Database Management Area */}
      <Card className="bg-[#12141c] border-gray-800 rounded-3xl overflow-hidden">
        <div className="border-b border-gray-800 bg-black/20 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tab Navigation */}
          <div className="flex gap-1.5 bg-gray-950/50 p-1.5 rounded-xl border border-gray-800/80 w-full md:w-auto overflow-x-auto">
            {[
              { id: "profiles", label: "Profiles", icon: UsersIcon },
              { id: "rides", label: "Rides", icon: CarIcon },
              { id: "bookings", label: "Bookings", icon: ClipboardIcon },
              { id: "requests", label: "Ride Requests", icon: FileTextIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setSearchQuery("");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Action */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="relative w-full md:w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="bg-gray-950/40 border-gray-800 rounded-xl pl-9 text-xs focus-visible:ring-cyan-500 focus-visible:ring-offset-0 text-white w-full"
              />
            </div>
            <Button
              onClick={() => setActiveModal(activeTab)}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold text-xs py-2 px-4 shrink-0 flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Record
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-gray-400 animate-pulse">Loading live database records...</div>
          ) : (
            <div className="overflow-x-auto w-full">
              {activeTab === "profiles" && (
                <Table>
                  <TableHeader className="bg-black/35 border-gray-800">
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400 text-xs">Full Name</TableHead>
                      <TableHead className="text-gray-400 text-xs">Email</TableHead>
                      <TableHead className="text-gray-400 text-xs">Role</TableHead>
                      <TableHead className="text-gray-400 text-xs">Vehicle Info</TableHead>
                      <TableHead className="text-gray-400 text-xs">Joined At</TableHead>
                      <TableHead className="text-gray-400 text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.length === 0 ? (
                      <TableRow className="border-gray-800 hover:bg-transparent"><TableCell colSpan={6} className="text-center py-8 text-gray-500 text-xs">No user profiles found.</TableCell></TableRow>
                    ) : (
                      filteredProfiles.map((p) => (
                        <TableRow key={p.id} className="border-gray-800 hover:bg-white/5 transition-colors">
                          <TableCell className="font-semibold text-white text-xs">{p.full_name}</TableCell>
                          <TableCell className="text-gray-300 text-xs">{p.email}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 border-0 ${p.role === "driver" ? "bg-cyan-500/10 text-cyan-400" : p.role === "admin" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                              {p.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 text-xs">
                            {p.role === "driver" && p.vehicle_plate ? (
                              <span>{p.vehicle_model} ({p.vehicle_color}) - <span className="text-gray-300 font-mono">{p.vehicle_plate}</span></span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-400 text-xs">{formatDateTime(p.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" className="hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg h-8 w-8" onClick={() => handleDelete("profiles", p.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {activeTab === "rides" && (
                <Table>
                  <TableHeader className="bg-black/35 border-gray-800">
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400 text-xs">Driver</TableHead>
                      <TableHead className="text-gray-400 text-xs">Pickup / Dropoff</TableHead>
                      <TableHead className="text-gray-400 text-xs">Departure</TableHead>
                      <TableHead className="text-gray-400 text-xs">Seats</TableHead>
                      <TableHead className="text-gray-400 text-xs">Fare</TableHead>
                      <TableHead className="text-gray-400 text-xs">Status</TableHead>
                      <TableHead className="text-gray-400 text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRides.length === 0 ? (
                      <TableRow className="border-gray-800 hover:bg-transparent"><TableCell colSpan={7} className="text-center py-8 text-gray-500 text-xs">No rides found.</TableCell></TableRow>
                    ) : (
                      filteredRides.map((r) => (
                        <TableRow key={r.id} className="border-gray-800 hover:bg-white/5 transition-colors">
                          <TableCell className="font-semibold text-white text-xs">{r.profiles?.full_name || "Unknown Driver"}</TableCell>
                          <TableCell className="text-xs text-gray-300">
                            {r.pickup_location} → {r.destination.replace(/\[[^\]]+\]/g, "").trim()}
                          </TableCell>
                          <TableCell className="text-gray-400 text-xs">{formatDateTime(r.departure_time)}</TableCell>
                          <TableCell className="text-gray-300 text-xs font-semibold">{r.available_seats} Seats</TableCell>
                          <TableCell className="text-cyan-400 text-xs font-bold">RM{Number(r.cost_per_person || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 border-0 ${r.status === "active" ? "bg-cyan-500/10 text-cyan-400" : r.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" className="hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg h-8 w-8" onClick={() => handleDelete("rides", r.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {activeTab === "bookings" && (
                <Table>
                  <TableHeader className="bg-black/35 border-gray-800">
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400 text-xs">Passenger</TableHead>
                      <TableHead className="text-gray-400 text-xs">Route</TableHead>
                      <TableHead className="text-gray-400 text-xs">Departure Time</TableHead>
                      <TableHead className="text-gray-400 text-xs">Status</TableHead>
                      <TableHead className="text-gray-400 text-xs">Created At</TableHead>
                      <TableHead className="text-gray-400 text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow className="border-gray-800 hover:bg-transparent"><TableCell colSpan={6} className="text-center py-8 text-gray-500 text-xs">No bookings found.</TableCell></TableRow>
                    ) : (
                      filteredBookings.map((b) => (
                        <TableRow key={b.id} className="border-gray-800 hover:bg-white/5 transition-colors">
                          <TableCell className="font-semibold text-white text-xs">{b.profiles?.full_name || "Unknown Passenger"}</TableCell>
                          <TableCell className="text-xs text-gray-300">
                            {b.rides?.pickup_location || "—"} → {b.rides?.destination?.replace(/\[[^\]]+\]/g, "").trim() || "—"}
                          </TableCell>
                          <TableCell className="text-gray-400 text-xs">{b.rides?.departure_time ? formatDateTime(b.rides.departure_time) : "—"}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 border-0 ${b.booking_status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" : b.booking_status === "pending" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                              {b.booking_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 text-xs">{formatDateTime(b.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" className="hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg h-8 w-8" onClick={() => handleDelete("bookings", b.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {activeTab === "requests" && (
                <Table>
                  <TableHeader className="bg-black/35 border-gray-800">
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400 text-xs">Passenger</TableHead>
                      <TableHead className="text-gray-400 text-xs">Pickup / Dropoff</TableHead>
                      <TableHead className="text-gray-400 text-xs">Departure</TableHead>
                      <TableHead className="text-gray-400 text-xs">Seats Needed</TableHead>
                      <TableHead className="text-gray-400 text-xs">Status</TableHead>
                      <TableHead className="text-gray-400 text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow className="border-gray-800 hover:bg-transparent"><TableCell colSpan={6} className="text-center py-8 text-gray-500 text-xs">No requests found.</TableCell></TableRow>
                    ) : (
                      filteredRequests.map((req) => (
                        <TableRow key={req.id} className="border-gray-800 hover:bg-white/5 transition-colors">
                          <TableCell className="font-semibold text-white text-xs">{req.profiles?.full_name || "Unknown Passenger"}</TableCell>
                          <TableCell className="text-xs text-gray-300">
                            {req.pickup_location} → {req.destination?.replace(/\[[^\]]+\]/g, "").trim()}
                          </TableCell>
                          <TableCell className="text-gray-400 text-xs">{formatDateTime(req.departure_time)}</TableCell>
                          <TableCell className="text-gray-300 text-xs font-semibold">{req.seats_needed} Seats</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 border-0 ${req.status === "open" ? "bg-cyan-500/10 text-cyan-400" : req.status === "accepted" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" className="hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg h-8 w-8" onClick={() => handleDelete("ride_requests", req.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Profile Dialog */}
      <Dialog open={activeModal === "profiles"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md bg-[#0f111a] border-gray-800 text-white rounded-2xl">
          <form onSubmit={handleAddProfile}>
            <DialogHeader>
              <DialogTitle className="text-white">Add New Profile</DialogTitle>
              <DialogDescription className="text-gray-400">Insert a new student or moderator account into the database.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Full Name</label>
                <Input
                  required
                  placeholder="e.g. Ahmad Faiz"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="bg-gray-950 border-gray-800 rounded-xl text-xs focus-visible:ring-cyan-500 focus-visible:ring-offset-0 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Email Address</label>
                <Input
                  required
                  type="email"
                  placeholder="e.g. faiz@student.utem.edu.my"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="bg-gray-950 border-gray-800 rounded-xl text-xs focus-visible:ring-cyan-500 focus-visible:ring-offset-0 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">System Role</label>
                <select
                  value={profileForm.role}
                  onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
                >
                  <option value="passenger">Passenger</option>
                  <option value="driver">Driver</option>
                  <option value="admin">Moderator / Admin</option>
                </select>
              </div>

              {profileForm.role === "driver" && (
                <div className="border border-cyan-500/20 bg-cyan-950/20 p-3 rounded-xl space-y-3">
                  <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">Driver Vehicle Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">Model</label>
                      <Input
                        placeholder="e.g. Perodua Myvi"
                        value={profileForm.vehicle_model}
                        onChange={(e) => setProfileForm({ ...profileForm, vehicle_model: e.target.value })}
                        className="bg-gray-950 border-gray-800 rounded-xl text-xs focus-visible:ring-cyan-500 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">Color</label>
                      <Input
                        placeholder="e.g. Silver"
                        value={profileForm.vehicle_color}
                        onChange={(e) => setProfileForm({ ...profileForm, vehicle_color: e.target.value })}
                        className="bg-gray-950 border-gray-800 rounded-xl text-xs focus-visible:ring-cyan-500 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400">Plate Number</label>
                    <Input
                      placeholder="e.g. WQY1234"
                      value={profileForm.vehicle_plate}
                      onChange={(e) => setProfileForm({ ...profileForm, vehicle_plate: e.target.value })}
                      className="bg-gray-950 border-gray-800 rounded-xl text-xs focus-visible:ring-cyan-500 text-white"
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl border-gray-800 text-xs" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-xs font-semibold text-white">
                Save Profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Ride Dialog */}
      <Dialog open={activeModal === "rides"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md bg-[#0f111a] border-gray-800 text-white rounded-2xl">
          <form onSubmit={handleAddRide}>
            <DialogHeader>
              <DialogTitle className="text-white">Add New Carpool Ride</DialogTitle>
              <DialogDescription className="text-gray-400">Offer a new ride slot on behalf of a registered driver.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Driver Account</label>
                <select
                  required
                  value={rideForm.driver_id}
                  onChange={(e) => setRideForm({ ...rideForm, driver_id: e.target.value })}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
                >
                  <option value="">Select a Driver...</option>
                  {profiles.filter(p => p.role === "driver" || p.role === "passenger").map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Pickup Origin</label>
                  <Input
                    required
                    placeholder="e.g. Melaka Sentral"
                    value={rideForm.pickup_location}
                    onChange={(e) => setRideForm({ ...rideForm, pickup_location: e.target.value })}
                    className="bg-gray-950 border-gray-800 rounded-xl text-xs focus-visible:ring-cyan-500 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Destination</label>
                  <Input
                    required
                    placeholder="e.g. UTeM Main [payment_method:cash]"
                    value={rideForm.destination}
                    onChange={(e) => setRideForm({ ...rideForm, destination: e.target.value })}
                    className="bg-gray-950 border-gray-800 rounded-xl text-xs focus-visible:ring-cyan-500 text-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Departure Time</label>
                <Input
                  required
                  type="datetime-local"
                  value={rideForm.departure_time}
                  onChange={(e) => setRideForm({ ...rideForm, departure_time: e.target.value })}
                  className="bg-gray-950 border-gray-800 rounded-xl text-xs focus-visible:ring-cyan-500 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Available Seats</label>
                  <Input
                    required
                    type="number"
                    min={1}
                    max={10}
                    value={rideForm.available_seats}
                    onChange={(e) => setRideForm({ ...rideForm, available_seats: Number(e.target.value) })}
                    className="bg-gray-950 border-gray-800 rounded-xl text-xs focus-visible:ring-cyan-500 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Cost (RM)</label>
                  <Input
                    required
                    type="number"
                    step="0.1"
                    min={0}
                    value={rideForm.cost_per_person}
                    onChange={(e) => setRideForm({ ...rideForm, cost_per_person: Number(e.target.value) })}
                    className="bg-gray-950 border-gray-800 rounded-xl text-xs focus-visible:ring-cyan-500 text-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Ride Status</label>
                <select
                  value={rideForm.status}
                  onChange={(e) => setRideForm({ ...rideForm, status: e.target.value })}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl border-gray-800 text-xs" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-xs font-semibold text-white">
                Save Ride
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Booking Dialog */}
      <Dialog open={activeModal === "bookings"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md bg-[#0f111a] border-gray-800 text-white rounded-2xl">
          <form onSubmit={handleAddBooking}>
            <DialogHeader>
              <DialogTitle className="text-white">Add New Ride Booking</DialogTitle>
              <DialogDescription className="text-gray-400">Link a passenger to an offered ride coordinate.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Passenger Account</label>
                <select
                  required
                  value={bookingForm.passenger_id}
                  onChange={(e) => setBookingForm({ ...bookingForm, passenger_id: e.target.value })}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
                >
                  <option value="">Select a Passenger...</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Active Ride Slot</label>
                <select
                  required
                  value={bookingForm.ride_id}
                  onChange={(e) => setBookingForm({ ...bookingForm, ride_id: e.target.value })}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
                >
                  <option value="">Select a Ride Offer...</option>
                  {rides.filter(r => r.status === "active").map(r => (
                    <option key={r.id} value={r.id}>
                      {r.pickup_location} → {r.destination.replace(/\[[^\]]+\]/g, "").trim()} (Driver: {r.profiles?.full_name || "Unknown"})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Booking Status</label>
                <select
                  value={bookingForm.booking_status}
                  onChange={(e) => setBookingForm({ ...bookingForm, booking_status: e.target.value })}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl border-gray-800 text-xs" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-xs font-semibold text-white">
                Save Booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Ride Request Dialog */}
      <Dialog open={activeModal === "requests"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md bg-[#0f111a] border-gray-800 text-white rounded-2xl">
          <form onSubmit={handleAddRequest}>
            <DialogHeader>
              <DialogTitle className="text-white">Add New Ride Request</DialogTitle>
              <DialogDescription className="text-gray-400">Publish a new request on behalf of a passenger.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Passenger Account</label>
                <select
                  required
                  value={requestForm.passenger_id}
                  onChange={(e) => setRequestForm({ ...requestForm, passenger_id: e.target.value })}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
                >
                  <option value="">Select a Passenger...</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Pickup Location</label>
                  <Input
                    required
                    placeholder="e.g. MITC Sector B"
                    value={requestForm.pickup_location}
                    onChange={(e) => setRequestForm({ ...requestForm, pickup_location: e.target.value })}
                    className="bg-gray-950 border-gray-800 rounded-xl text-xs focus-visible:ring-cyan-500 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Destination</label>
                  <Input
                    required
                    placeholder="e.g. FTMK Block"
                    value={requestForm.destination}
                    onChange={(e) => setRequestForm({ ...requestForm, destination: e.target.value })}
                    className="bg-gray-950 border-gray-800 rounded-xl text-xs focus-visible:ring-cyan-500 text-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Departure Time</label>
                <Input
                  required
                  type="datetime-local"
                  value={requestForm.departure_time}
                  onChange={(e) => setRequestForm({ ...requestForm, departure_time: e.target.value })}
                  className="bg-gray-950 border-gray-800 rounded-xl text-xs focus-visible:ring-cyan-500 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Seats Needed</label>
                <Input
                  required
                  type="number"
                  min={1}
                  max={10}
                  value={requestForm.seats_needed}
                  onChange={(e) => setRequestForm({ ...requestForm, seats_needed: Number(e.target.value) })}
                  className="bg-gray-950 border-gray-800 rounded-xl text-xs focus-visible:ring-cyan-500 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400">Request Status</label>
                <select
                  value={requestForm.status}
                  onChange={(e) => setRequestForm({ ...requestForm, status: e.target.value })}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
                >
                  <option value="open">Open</option>
                  <option value="accepted">Accepted</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl border-gray-800 text-xs" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-xs font-semibold text-white">
                Save Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
