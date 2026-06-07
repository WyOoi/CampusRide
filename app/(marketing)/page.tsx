"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Car,
  Leaf,
  MapPinned,
  Shield,
  Sparkles,
  Users,
  Wallet,
  Globe,
  Network,
  Cpu,
  Database,
  Fingerprint,
  RefreshCw,
  Share2,
  Compass,
  Terminal,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, UNIVERSITY } from "@/lib/constants";

const stats = [
  { label: "VERIFIED ACTIVE ACCOUNTS", value: "1,248 Users", hint: "Validated UTeM directories", icon: Users, color: "text-emerald-500" },
  { label: "ROUTING COMPILATION SPEED", value: "6.2 Sec", hint: "OSRM pathfinding latency", icon: Cpu, color: "text-cyan-500" },
  { label: "AVERAGE VALUE SHARE", value: "RM4.50 Trip", hint: "Direct student-to-driver split", icon: Wallet, color: "text-violet-500" },
];

const features = [
  {
    title: "Verified University Ecosystem",
    body: "Secured exclusively by Supabase Auth policies. Account creations require verified academic emails (@student.utem.edu.my / @utem.edu.my) to prevent third-party logins.",
    icon: Fingerprint,
    badge: "SUPABASE AUTH",
    color: "from-cyan-500/20 to-blue-500/20",
    iconColor: "text-cyan-400",
  },
  {
    title: "Real-Time P2P Matching Engine",
    body: "Combines high-performance OpenStreetMap and OSRM coordinate servers to calculate precise, toll-aware routes, connecting drivers and passengers instantly.",
    icon: Network,
    badge: "OSRM ENGINE",
    color: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
  },
  {
    title: "0% Platform Commissions",
    body: "Unlike commercial ride platforms, CampusRide does not deduct broker fees. Passengers reimburse drivers directly via Cash or DuitNow QR codes.",
    icon: Wallet,
    badge: "DIRECT FARE",
    color: "from-violet-500/20 to-fuchsia-500/20",
    iconColor: "text-violet-400",
  },
  {
    title: "Instant Cloud State Sync",
    body: "Synchronizes ride bookings and status transitions in real-time utilizing PostgreSQL triggers and Postgres Row-Level Security (RLS) tables.",
    icon: Database,
    badge: "POSTGRES RLS",
    color: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-400",
  },
];

export default function LandingPage() {
  const [matchLogs, setMatchLogs] = useState<string[]>([
    "Initializing GeoMesh...",
    "Scanning UTeM Main Campus...",
  ]);

  // Framer Motion 3D Hover Tilt effect values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for card rotation
  const rotateX = useSpring(useTransform(y, [-300, 300], [15, -15]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-300, 300], [-15, 15]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Simulate real-time database transaction log activity
  useEffect(() => {
    const actions = [
      "Route optimized for FTMK sector",
      "Secure session verified via Supabase JWT",
      "Real-time driver GPS ping received",
      "Seat booking confirmed in PostgreSQL",
      "Toll-split fare calculated via OSRM",
    ];

    const interval = setInterval(() => {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const newLog = `[${new Date().toLocaleTimeString()}] ${randomAction}`;
      
      setMatchLogs((prev) => [newLog, ...prev.slice(0, 3)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#060a13] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden relative">
      
      {/* Tech Grid Background Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      
      {/* Glowing Neon Ambient Lights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none animate-pulse [animation-duration:10s]" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-[30rem] h-[30rem] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none animate-pulse [animation-duration:8s]" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* Left Hero Column */}
          <motion.div 
            className="lg:col-span-7 space-y-6"
            initial={{ opacity: 0, x: -25 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-md text-cyan-400 text-[10px] font-mono uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              UTeM P2P Carpool Network v2.0
            </div>

            <h1 className="text-balance text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] bg-clip-text text-transparent bg-gradient-to-r from-slate-50 via-slate-100 to-slate-400">
              Instant Peer-to-Peer Carpooling. Built for <span className="text-cyan-400 shadow-cyan-500/20 drop-shadow-[0_0_12px_rgba(34,211,238,0.3)]">{UNIVERSITY.short} Commuters</span>.
            </h1>

            <p className="max-w-xl text-pretty text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
              A high-performance carpooling client powered by Next.js and Supabase. Verified by university academic emails, optimized by OSRM routing, and structured with 0% platform commission cuts.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Button asChild size="lg" className="rounded-xl text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] border-0 transition-all duration-300">
                <Link href="/register">
                  Initialize Client <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl text-sm border-slate-800 bg-slate-900/30 hover:bg-slate-800/80 hover:text-white transition-all text-slate-300 font-semibold backdrop-blur-md">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            {/* Terminal HUD: Database Logs */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 max-w-lg font-mono text-[10px] text-slate-400 shadow-2xl backdrop-blur-md space-y-1.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl" />
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-cyan-500 border-b border-slate-900 pb-1.5 font-bold">
                <Terminal className="h-3 w-3" />
                <span>Supabase Live Event Logs</span>
              </div>
              <div className="space-y-0.5">
                {matchLogs.map((log, idx) => (
                  <p key={idx} className={idx === 0 ? "text-cyan-400" : ""}>
                    {log}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Hero Column (Interactive 3D Hover Radar Mockup) */}
          <div 
            className="lg:col-span-5 relative"
            style={{ perspective: 1000 }}
          >
            <div className="absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-tr from-cyan-500/10 via-transparent to-violet-500/10 blur-3xl pointer-events-none" />
            
            {/* Tilted Cybernetic Glass Panel with 3D hover */}
            <motion.div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }}
              className="transition-all duration-100 ease-out"
            >
              <Card className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/40 shadow-2xl shadow-black/60 backdrop-blur-xl relative">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                <CardContent className="p-6 sm:p-8 space-y-6">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-mono tracking-widest text-cyan-400 block uppercase">OSRM PATHFINDER</span>
                      <h3 className="text-base font-bold text-slate-200">Melaka Sentral Node</h3>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-semibold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ROUTING_ACTIVE
                    </div>
                  </div>

                  {/* Radar visualization mockup */}
                  <div className="h-44 w-full rounded-2xl bg-slate-950/80 border border-slate-900 relative flex items-center justify-center overflow-hidden">
                    
                    {/* Radar Circles */}
                    <div className="absolute w-40 h-40 rounded-full border border-cyan-500/10" />
                    <div className="absolute w-28 h-28 rounded-full border border-cyan-500/15" />
                    <div className="absolute w-16 h-16 rounded-full border border-cyan-500/20" />
                    
                    {/* Radar grid coordinates line */}
                    <div className="absolute w-[200px] h-[1px] bg-cyan-500/5 rotate-45" />
                    <div className="absolute w-[200px] h-[1px] bg-cyan-500/5 -rotate-45" />

                    {/* Scanning sweep beam */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-transparent origin-center w-full h-full rounded-full animate-spin [animation-duration:6s] ease-linear pointer-events-none" />

                    {/* Center Node */}
                    <div className="relative z-10 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_15px_#22d3ee] flex items-center justify-center">
                      <span className="absolute w-6 h-6 rounded-full border border-cyan-400/50 animate-ping" />
                    </div>

                    {/* Peer Nodes */}
                    <motion.div 
                      className="absolute top-1/4 left-1/3 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                    />
                    <motion.div 
                      className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                      animate={{ y: [0, 2, 0] }}
                      transition={{ repeat: Infinity, duration: 2.7, ease: "easeInOut" }}
                    />
                    <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 rounded-full bg-slate-600" />
                    
                    {/* HUD Info */}
                    <div className="absolute bottom-2 left-3 font-mono text-[8px] text-slate-500 flex items-center gap-1">
                      <Compass className="h-2.5 w-2.5 text-cyan-500" />
                      <span>GPS: SYNCED · OSRM_V5_ENG</span>
                    </div>
                    <div className="absolute top-2 right-3 font-mono text-[8px] text-slate-500">
                      <span>CLIENT_GRID_UTEM</span>
                    </div>
                  </div>


                  {/* Info block */}
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="rounded-xl bg-slate-900/30 border border-slate-900 p-2">
                      <p className="text-[10px] text-slate-500 uppercase font-mono">SEATS</p>
                      <p className="mt-1 text-sm font-bold text-slate-200">2 Available</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/30 border border-slate-900 p-2">
                      <p className="text-[10px] text-slate-500 uppercase font-mono">DISTANCE</p>
                      <p className="mt-1 text-sm font-bold text-slate-200">18.4 km</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/30 border border-slate-900 p-2">
                      <p className="text-[10px] text-slate-500 uppercase font-mono">FARE SPLIT</p>
                      <p className="mt-1 text-sm font-bold text-cyan-400">RM 5.00</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Live Platform Metrics */}
      <section className="border-y border-slate-900 bg-slate-950/50 backdrop-blur-md py-12 relative">
        <div className="absolute inset-0 bg-cyan-500/[0.01] pointer-events-none" />
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3 sm:px-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Card className="rounded-2xl border-slate-900 bg-slate-900/10 hover:border-slate-800/80 transition-all duration-300">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-slate-950/80 border border-slate-800/50 ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">{s.label}</p>
                    <p className="mt-0.5 text-xl font-bold text-slate-200 tracking-tight">{s.value}</p>
                    <p className="text-[10px] text-slate-400 truncate">{s.hint}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* The Commuter Problem */}
      <section id="problem" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 block uppercase">[ THE COMMUTER PROBLEM ]</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">
              Centralized Transit Systems Fail Commuters.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Queuing for campus shuttle buses wastes valuable time, private e-hailing charges premium surge fees, and single-commuter parking chokes UTeM lots. CampusRide replaces centralized dependencies with a peer-coordinated routing application.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              { title: "Shuttle Capacity Surge", body: "Technology and Main campus bus corridors bottleneck heavily during exam weeks, causing long student queues.", icon: Sparkles, color: "border-cyan-500/20 text-cyan-400" },
              { title: "Centralized Commission Cut", body: "Commercial ride-hailing networks deduct 20% to 30% from driver earnings. We implement 0% platform cuts.", icon: Wallet, color: "border-violet-500/20 text-violet-400" },
              { title: "Campus Carbon Footprint", body: "High single-occupancy vehicle flow raises campus emission counts. Shared empty seats relieve parking lot congestion.", icon: Leaf, color: "border-emerald-500/20 text-emerald-400" },
            ].map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex gap-4 rounded-2xl border bg-slate-950/40 p-5 shadow-lg backdrop-blur-md hover:border-slate-800 transition-all duration-300 ${p.color}`}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-900 border border-slate-800">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">{p.title}</p>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{p.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Architecture / Bento-Box Features Grid */}
      <section id="features" className="border-t border-slate-950 bg-slate-950/20 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 block uppercase">[ CORE PLATFORM FEATURES ]</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">
              Engineered for Complete Commuter Autonomy.
            </h2>
            <p className="text-sm text-slate-400">
              The CampusRide client integrates standard Web API geolocation sensors and OpenStreetMap routing meshes in a high-fidelity glassmorphic dashboard.
            </p>
          </div>
          
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full rounded-2xl border-slate-900 bg-slate-950/40 hover:border-slate-800/80 transition-all duration-500 overflow-hidden relative group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  <CardContent className="flex gap-4 p-6">
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-900 border border-slate-800 ${f.iconColor} shadow-inner`}>
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-slate-200">{f.title}</p>
                        <Badge variant="outline" className="border-slate-800 text-[8px] font-mono px-1.5 text-slate-400 bg-slate-900/50 rounded-sm">
                          {f.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{f.body}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Call to Action Section */}
      <section className="border-t border-slate-900 bg-gradient-to-b from-[#080d19] to-[#040810] py-20 sm:py-24 relative overflow-hidden">
        
        {/* Glow behind CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[15rem] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 relative z-10 text-center space-y-8">
          <div className="space-y-4">
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 block uppercase">[ ACCESS_SYSTEM ]</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
              Ready to initialize the CampusRide client?
            </h2>
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-400 leading-relaxed">
              Authenticate via Supabase Auth, list empty vehicle seats, parse active routing lines, and test moderation dashboards immediately.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
            <Button asChild size="lg" className="w-full sm:w-auto rounded-xl text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.45)] border-0 transition-all duration-300">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto rounded-xl text-sm border-slate-800 bg-slate-900/40 hover:bg-slate-800/80 hover:text-white transition-all text-slate-300 font-semibold">
              <Link href="/find">Explore Active Rides</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}