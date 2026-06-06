import { create } from "zustand";
import type { MockRide } from "@/types";
import { mockRides } from "@/data/mock-rides";

interface RidesState {
  rides: MockRide[];
  joinedRideIds: string[];
  initialized: boolean;
  initializeStore: () => void;
  joinRide: (rideId: string) => boolean;
}

export const useRidesStore = create<RidesState>((set, get) => ({
  rides: mockRides,
  joinedRideIds: [],
  initialized: false,
  initializeStore: () => {
    if (get().initialized) return;

    let storedRides = mockRides;
    let storedJoined: string[] = [];

    if (typeof window !== "undefined") {
      const ridesData = localStorage.getItem("passenger-rides");
      if (ridesData) {
        try {
          storedRides = JSON.parse(ridesData);
        } catch (e) {
          storedRides = mockRides;
        }
      } else {
        localStorage.setItem("passenger-rides", JSON.stringify(mockRides));
      }

      const joinedData = localStorage.getItem("joined-rides");
      if (joinedData) {
        try {
          storedJoined = JSON.parse(joinedData);
        } catch (e) {
          storedJoined = [];
        }
      }
    }

    set({ rides: storedRides, joinedRideIds: storedJoined, initialized: true });
  },
  joinRide: (rideId) => {
    const { rides, joinedRideIds } = get();
    const rideIndex = rides.findIndex((r) => r.id === rideId);
    if (rideIndex === -1) return false;

    const ride = rides[rideIndex];
    if (ride.seatsAvailable <= 0) return false;

    // Check if already joined
    if (joinedRideIds.includes(rideId)) return false;

    const updatedRides = rides.map((r) => {
      if (r.id === rideId) {
        return { ...r, seatsAvailable: r.seatsAvailable - 1 };
      }
      return r;
    });

    const updatedJoined = [...joinedRideIds, rideId];

    if (typeof window !== "undefined") {
      localStorage.setItem("passenger-rides", JSON.stringify(updatedRides));
      localStorage.setItem("joined-rides", JSON.stringify(updatedJoined));
    }

    set({ rides: updatedRides, joinedRideIds: updatedJoined });
    return true;
  },
}));
