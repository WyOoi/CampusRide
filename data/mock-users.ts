import type { MockUser } from "@/types";

export const mockUsers: MockUser[] = [
  {
    id: "u1",
    name: "Aina Rahman",
    email: "aina.rahman@student.utem.edu.my",
    role: "both",
    rating: 4.9,
    ridesCompleted: 128,
    verified: true,
    faculty: "FKE — Electrical Engineering",
  },
  {
    id: "u2",
    name: "Darren Lim",
    email: "darren.lim@student.utem.edu.my",
    role: "driver",
    rating: 4.7,
    ridesCompleted: 54,
    verified: true,
    faculty: "FPTT — Information Technology",
  },
  {
    id: "u3",
    name: "Dr. Hafiz Ibrahim",
    email: "hafiz.ibrahim@utem.edu.my",
    role: "driver",
    rating: 5.0,
    ridesCompleted: 31,
    verified: true,
    faculty: "FKM — Mechanical Engineering (Staff)",
  },
  {
    id: "u4",
    name: "Siti Nurhaliza Kamal",
    email: "siti.nurhaliza@student.utem.edu.my",
    role: "passenger",
    rating: 4.8,
    ridesCompleted: 22,
    verified: true,
    faculty: "FKE — Mechatronics",
  },
];

export const currentMockUser = mockUsers[0]!;
