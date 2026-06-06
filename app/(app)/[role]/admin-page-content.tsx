"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockReports, mockVerificationRequests } from "@/data/mock-admin";
import { formatDateTime } from "@/utils/format";
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

const userGrowth = [
  { week: "W1", users: 120 },
  { week: "W2", users: 168 },
  { week: "W3", users: 210 },
  { week: "W4", users: 264 },
  { week: "W5", users: 318 },
];

const rideVolume = [
  { day: "Mon", rides: 42 },
  { day: "Tue", rides: 55 },
  { day: "Wed", rides: 48 },
  { day: "Thu", rides: 61 },
  { day: "Fri", rides: 74 },
  { day: "Sat", rides: 36 },
  { day: "Sun", rides: 28 },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Moderator dashboard"
        description="Operational cockpit for verification, safety reports, and growth charts — mock analytics only."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active users (7d)", value: "1,024", hint: "+12% vs last week" },
          { label: "Rides completed", value: "386", hint: "Across both campuses" },
          { label: "Open reports", value: "2", hint: "SLA: 24h first response" },
          { label: "Pending verifications", value: "9", hint: "Email + student ID" },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">{s.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User growth (mock)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
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
                    borderColor: "#e2e8f0",
                    background: "#ffffff",
                  }}
                />
                <Area type="monotone" dataKey="users" stroke="#10b981" fill="url(#fillUsers)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ride volume (mock)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rideVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-white/10" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#e2e8f0",
                    background: "#ffffff",
                  }}
                />
                <Bar dataKey="rides" fill="#38bdf8" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Safety reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reporter</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockReports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.reporter}</TableCell>
                  <TableCell className="text-muted-foreground">{r.subject}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatDateTime(r.createdISO)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verification requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockVerificationRequests.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.user}</TableCell>
                  <TableCell className="text-muted-foreground">{v.email}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === "Pending" ? "secondary" : "outline"} className="rounded-full">
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatDateTime(v.submittedISO)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
