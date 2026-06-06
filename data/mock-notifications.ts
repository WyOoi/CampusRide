import type { MockNotification } from "@/types";

export const mockNotifications: MockNotification[] = [
  {
    id: "n1",
    title: "Booking confirmed",
    body: "Your seat on Darren’s ride to Melaka Sentral is confirmed for today.",
    timeISO: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    type: "booking",
    read: false,
  },
  {
    id: "n2",
    title: "Driver arriving soon",
    body: "Dr. Hafiz is 6 minutes away at Technology Campus pick-up point.",
    timeISO: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    type: "ride",
    read: false,
  },
  {
    id: "n3",
    title: "New ride near you",
    body: "A verified driver posted Ayer Keroh → UTeM Main Campus (RM5/seat).",
    timeISO: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: "alert",
    read: true,
  },
  {
    id: "n4",
    title: "Weekly safety digest",
    body: "CampusRide tips: verify plate numbers and share trip with a friend.",
    timeISO: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    type: "system",
    read: true,
  },
];
