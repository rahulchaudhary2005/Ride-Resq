import { create } from "zustand";
import { apiClient } from "../services/apiClient";
import type {
  ServiceRequest,
  ServiceCategory,
} from "@roadguard/shared-types";

export interface FareQuote {
  category: ServiceCategory;
  estimatedFare: number;
  distanceKm: number;
  baseFare: number;
  distanceFare: number;
  surgeMultiplier: number;
  minFare: number;
  pricingVersion: number;
}

interface RequestState {
  activeRequest: ServiceRequest | null;
  history: ServiceRequest[];

  getQuote: (input: {
    category: ServiceCategory;
    pickupLat: number;
    pickupLng: number;
    dropLat?: number;
    dropLng?: number;
  }) => Promise<FareQuote>;

  createRequest: (input: {
    category: ServiceCategory;
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    dropLat?: number;
    dropLng?: number;
    dropAddress?: string;
    vehicleId?: string;
    description?: string;
    customerRequestedFare?: number;
  }) => Promise<ServiceRequest>;

  fetchMine: () => Promise<void>;
  setActive: (
    req: ServiceRequest | null,
  ) => void;
}

export const useRequestStore =
  create<RequestState>((set) => ({
    activeRequest: null,
    history: [],

    async getQuote(input) {
      const { data } =
        await apiClient.post(
          "/requests/quote",
          input,
        );

      return data.data;
    },

    async createRequest(input) {
      const { data } =
        await apiClient.post(
          "/requests",
          input,
        );

      set({
        activeRequest: data.data,
      });

      return data.data;
    },

    async fetchMine() {
      const { data } =
        await apiClient.get(
          "/requests/mine",
        );

      set({
        history: data.data,
      });
    },

    setActive(req) {
      set({
        activeRequest: req,
      });
    },
  }));