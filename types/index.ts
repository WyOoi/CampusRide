export type UserRole = "driver" | "passenger" | "both";

export type RideStatus =
  | "Searching"
  | "Confirmed"
  | "Driver Arriving"
  | "In Progress"
  | "Completed";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  rating: number;
  ridesCompleted: number;
  verified: boolean;
  faculty: string;
}

export interface MockRide {
  id: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  origin: string;
  destination: string;
  originCoords: [number, number];
  destinationCoords: [number, number];
  departureISO: string;
  seatsTotal: number;
  seatsAvailable: number;
  pricePerSeatMYR: number;
  distanceKm: number;
  etaMinutes: number;
  status: RideStatus;
  vehicle: string;
  notes?: string;
}

export interface MockNotification {
  id: string;
  title: string;
  body: string;
  timeISO: string;
  type: "ride" | "booking" | "system" | "alert";
  read: boolean;
}

export interface MockReport {
  id: string;
  reporter: string;
  subject: string;
  status: "Open" | "Reviewing" | "Closed";
  createdISO: string;
}

export interface MockVerificationRequest {
  id: string;
  user: string;
  email: string;
  submittedISO: string;
  status: "Pending" | "Approved" | "Rejected";
}
