/**
 * RoadGuard design tokens — shared across customer-mobile and mechanic-mobile.
 *
 * Same vocabulary as apps/admin-web/src/app/globals.css: amber beacon marks
 * an active job, GPS route lines are blue, brake-light red is danger, clear
 * green is a completed job. One palette, three surfaces (web admin, customer
 * app, mechanic app) — a recruiter opening all three should recognize it as
 * one product built by one person, not three unrelated screens.
 *
 * "Night dispatch" (dark) is the default, same reasoning as the web app:
 * most roadside jobs happen after dark, so dark isn't an afterthought here.
 */

export type ThemeMode = "light" | "dark";

export interface RoadGuardTheme {
  mode: ThemeMode;
  bg: string;
  bgElevated: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  beacon: string; // amber — primary accent, pending/active job marker
  beaconInk: string; // text/icon color placed on top of beacon amber
  route: string; // GPS blue — live tracking only, never decorative
  brake: string; // red — danger / cancelled
  clear: string; // green — completed / success
  radius: { sm: number; md: number; lg: number; pill: number };
  spacing: (n: number) => number;
}

const shared = {
  beacon: "#FFB020",
  beaconInk: "#14161B",
  route: "#4C8DFF",
  brake: "#E14434",
  clear: "#34C77B",
  radius: { sm: 6, md: 12, lg: 20, pill: 999 },
  spacing: (n: number) => n * 4,
};

export const lightTheme: RoadGuardTheme = {
  mode: "light",
  bg: "#ECEEF0",
  bgElevated: "#FFFFFF",
  surface: "#F5F6F7",
  border: "#D8DBDE",
  textPrimary: "#14161B",
  textSecondary: "#4B5158",
  textTertiary: "#7A8088",
  ...shared,
};

export const darkTheme: RoadGuardTheme = {
  mode: "dark",
  bg: "#14161B",
  bgElevated: "#1D2026",
  surface: "#22252C",
  border: "#2C3038",
  textPrimary: "#F2F3F5",
  textSecondary: "#A9AEB6",
  textTertiary: "#6C7178",
  ...shared,
};

/** Status → color mapping, one source of truth reused everywhere a
 *  ServiceRequest status renders (job tiles, badges, tracking screen). */
export function statusColor(
  theme: RoadGuardTheme,
  status: "PENDING" | "ACCEPTED" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_MECHANIC_FOUND"
): string {
  switch (status) {
    case "PENDING":
      return theme.beacon;
    case "ACCEPTED":
    case "ARRIVED":
    case "IN_PROGRESS":
      return theme.route;
    case "COMPLETED":
      return theme.clear;
    case "CANCELLED":
    case "NO_MECHANIC_FOUND":
      return theme.brake;
    default:
      return theme.textTertiary;
  }
}
