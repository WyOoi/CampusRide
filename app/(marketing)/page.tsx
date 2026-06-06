"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, UNIVERSITY } from "@/lib/constants";

const stats = [
  { label: "Avg. match time (mock)", value: "6 min", hint: "Peak hours around SRC" },
  { label: "Parking relief (est.)", value: "32%", hint: "Fewer duplicate cars to campus" },
  { label: "Cost share trips", value: "RM4–8", hint: "Typical Melaka corridor rides" },
];

const features = [
  {
    title: "University email gate",
    body: "Only verified @student.utem.edu.my / @staff.utem.edu.my identities (mock UI).",
    icon: BadgeCheck,
  },
  {
    title: "Role-aware flows",
    body: "Switch between driver offers and passenger search without losing context.",
    icon: Users,
  },
  {
    title: "Live map preview",
    body: "OpenStreetMap + Leaflet for route previews and simulated GPS tracking.",
    icon: MapPinned,
  },
  {
    title: "Fair fare splits",
    body: "Transparent per-seat estimates for toll-heavy Melaka routes.",
    icon: Wallet,
  },
];

const testimonials = [
  {
    quote:
      "I used to miss 8am labs when the campus shuttle was full. CampusRide matches me with seniors driving past MITC.",
    name: "Izzati — FTMK",
  },
  {
    quote:
      "As a staff member, parking near FKM is painful on Tuesdays. Carpooling cut my weekly fuel bill noticeably.",
    name: "Dr. Hafiz — FKM",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(59,130,246,0.12),_transparent_55%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Badge variant="muted" className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
              {UNIVERSITY.short}-exclusive prototype
            </Badge>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Carpool like a startup. Built for {UNIVERSITY.short} commuters.
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              {APP_NAME} helps students and staff split rides, reduce parking stress, and move faster between campuses —
              with a premium UI you can demo today (mock data only).
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="rounded-2xl text-base">
                <Link href="/register">
                  Create account <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="rounded-2xl text-base">
                <Link href="/dashboard">Explore dashboard</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No backend attached — perfect for FYP demos, hackathons, and investor walkthroughs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="relative"
          >
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-chart-2/20 blur-2xl" />
            <Card className="overflow-hidden rounded-3xl border-border/70 shadow-lg shadow-black/10 dark:shadow-black/30">
              <CardContent className="space-y-4 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today</p>
                    <p className="text-lg font-semibold">Ride to Melaka Sentral</p>
                  </div>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">Confirmed</span>
                </div>
                <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <Car className="h-4 w-4 text-primary" />
                    Perodua Myvi · WXY 1234
                  </div>
                  <p className="mt-2 text-muted-foreground">Pickup: SRC A lobby · ETA 12 min</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: "18%" }}
                      animate={{ width: "72%" }}
                      transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded-2xl bg-background p-3">
                    <p className="text-muted-foreground">Seats</p>
                    <p className="mt-1 text-base font-semibold">2</p>
                  </div>
                  <div className="rounded-2xl bg-background p-3">
                    <p className="text-muted-foreground">Distance</p>
                    <p className="mt-1 text-base font-semibold">18 km</p>
                  </div>
                  <div className="rounded-2xl bg-background p-3">
                    <p className="text-muted-foreground">Share</p>
                    <p className="mt-1 text-base font-semibold">RM6</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/40 py-14">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-3 sm:px-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{s.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{s.hint}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">Problem statement</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Campus mobility is fragmented</h2>
            <p className="mt-4 text-muted-foreground">
              Buses fill quickly, e-hailing surges during exams, and everyone pays the “single-occupancy parking tax”.
              {APP_NAME} visualises a calmer alternative: trusted carpools anchored to {UNIVERSITY.short} email domains.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              { title: "Shuttle bottlenecks", body: "Peak-hour queues at Technology ↔ Main campus links.", icon: Sparkles },
              { title: "Parking pressure", body: "FKM / FKE zones spike on lab days — fewer cars helps everyone.", icon: Leaf },
              { title: "Student budgets", body: "Splitting toll + fuel keeps rides fair and predictable.", icon: Wallet },
            ].map((p, i) => {
              const Icon = p.icon;
              return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
                </div>
              </motion.div>
            );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">Features</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Everything you need for a believable MVP</h2>
            <p className="mt-3 text-muted-foreground">
              Modular layouts, shadcn/ui primitives, Leaflet maps, and motion-rich cards — wired together with mock JSON.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full rounded-2xl">
                  <CardContent className="flex gap-4 p-6">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{f.title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Testimonials</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Voices from a near-future {UNIVERSITY.short}</h2>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            Quotes are fictional — for narrative polish only.
          </div>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-sm"
            >
              <blockquote className="text-base leading-relaxed text-muted-foreground">“{t.quote}”</blockquote>
              <figcaption className="mt-6 text-sm font-semibold text-foreground">{t.name}</figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-gradient-to-br from-primary/15 via-background to-background py-16 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Ready to pitch CampusRide?</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Walk investors through onboarding, matching, tracking, and admin moderation — all in one polished Next.js
              frontend.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="rounded-2xl">
              <Link href="/login">Sign in UI</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-2xl">
              <Link href="/find">Browse rides</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
