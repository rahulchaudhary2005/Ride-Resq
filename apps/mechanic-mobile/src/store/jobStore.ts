import { create } from "zustand";
import type { ServiceRequest } from "@roadguard/shared-types";

interface JobState {
  isOnline: boolean;
  incomingRequest: ServiceRequest | null;
  activeJob: ServiceRequest | null;
  setOnline: (v: boolean) => void;
  setIncomingRequest: (r: ServiceRequest | null) => void;
  setActiveJob: (r: ServiceRequest | null) => void;
}

export const useJobStore = create<JobState>((set) => ({
  isOnline: false,
  incomingRequest: null,
  activeJob: null,
  setOnline: (v) => set({ isOnline: v }),
  setIncomingRequest: (r) => set({ incomingRequest: r }),
  setActiveJob: (r) => set({ activeJob: r }),
}));
