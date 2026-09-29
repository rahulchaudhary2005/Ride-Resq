"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "../lib/theme";

const LINKS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "⌂",
  },
  {
    href: "/requests",
    label: "Live Requests",
    icon: "↯",
  },
  {
    href: "/mechanics",
    label: "Mechanics",
    icon: "⚒",
  },
  {
    href: "/pricing",
    label: "Pricing",
    icon: "₹",
  },
  {
    href: "/support",
    label: "Support",
    icon: "?",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className={`sidebar-backdrop ${open ? "is-open" : ""}`}
        onClick={() => setOpen(false)}
      />

      <aside className={`app-sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">RG</div>

          <div>
            <div className="brand-name">
              Road<span>Guard</span>
            </div>

            <div className="brand-caption">
              COMMAND CENTER
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <div className="dispatch-status">
          <span className="live-dot" />

          <div>
            <strong>Dispatch online</strong>
            <small>All systems operational</small>
          </div>
        </div>

        <nav
          className="sidebar-nav"
          aria-label="Admin navigation"
        >
          <p className="nav-label">Workspace</p>

          {LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`nav-link ${active ? "is-active" : ""
                  }`}
              >
                <span
                  className="nav-icon"
                  aria-hidden="true"
                >
                  {link.icon}
                </span>

                <span>{link.label}</span>

                {active && (
                  <span className="nav-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="operator-card">
            <div className="avatar">AD</div>

            <div>
              <strong>Administrator</strong>
              <span>Control room</span>
            </div>

            <span className="online-dot" />
          </div>

          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}