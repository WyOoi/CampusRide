import { create } from "zustand";
import type { UserRole } from "@/types";
import { currentMockUser } from "@/data/mock-users";

interface SessionState {
  /** Mock “logged in” user for UI demos */
  user: typeof currentMockUser;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: currentMockUser,
  activeRole: currentMockUser.role === "both" ? "passenger" : currentMockUser.role,
  setActiveRole: (role) => set({ activeRole: role }),
}));
