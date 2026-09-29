"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

const titles: Record<string, string> = {
  "/dashboard": "Operations Overview",
  "/requests": "Live Service Requests",
  "/mechanics": "Mechanic Network",
  "/pricing": "Service Pricing",
  "/support": "Support Center",
};

export function Shell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname?.startsWith("/login")) {
    return <>{children}</>;
  }

  const key =
    Object.keys(titles).find((item) =>
      pathname?.startsWith(item)
    ) ?? "/dashboard";

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        <header className="topbar">
          <div>
            <div className="eyebrow">
              ROADGUARD / ADMIN
            </div>

            <h1>{titles[key]}</h1>
          </div>

          <div className="topbar-actions">
            <span className="system-pill">
              <span className="live-dot" />
              Live network
            </span>

            <div className="topbar-time">
              DISPATCH CONSOLE
            </div>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}