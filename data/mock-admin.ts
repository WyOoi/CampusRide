import type { MockReport, MockVerificationRequest } from "@/types";

export const mockReports: MockReport[] = [
  {
    id: "rep1",
    reporter: "Siti N. Kamal",
    subject: "Late cancellation — no-show at SRC B",
    status: "Reviewing",
    createdISO: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rep2",
    reporter: "Anonymous",
    subject: "Vehicle plate mismatch (reported safely after trip)",
    status: "Open",
    createdISO: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rep3",
    reporter: "Aina Rahman",
    subject: "Resolved: refund for duplicate charge (mock)",
    status: "Closed",
    createdISO: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockVerificationRequests: MockVerificationRequest[] = [
  {
    id: "v1",
    user: "Muhammad Iqbal",
    email: "muhammad.iqbal@student.utem.edu.my",
    submittedISO: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: "Pending",
  },
  {
    id: "v2",
    user: "Lee Zi Xuan",
    email: "zi.xuan@student.utem.edu.my",
    submittedISO: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    status: "Pending",
  },
  {
    id: "v3",
    user: "Nur Ain Fadzil",
    email: "nur.ain@staff.utem.edu.my",
    submittedISO: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    status: "Approved",
  },
];
