"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "../../lib/api";
import { StatCard } from "../../components/StatCard";

export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboard() {
    try {
      setRefreshing(true);
      setError("");

      const { data } =
        await api.get("/admin/dashboard");

      setStats(data.data);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        document.cookie =
          "adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        router.replace("/login");
        return;
      }

      setError(
        "Unable to load dashboard data. Check the backend and database."
      );
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (error) {
    return (
      <div className="surface-panel empty-state">
        <div style={{ fontSize: 25 }}>
          ⚠
        </div>

        <p>{error}</p>

        <button
          className="btn btn-primary"
          onClick={loadDashboard}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="surface-panel empty-state">
        Loading dispatch data
        <span className="loading-dots" />
      </div>
    );
  }

  const bars = [
    38, 55, 42, 70, 60, 84,
    65, 94, 76, 61, 86, 73,
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Live operations</h2>

          <p>
            Real-time service health across the
            RoadGuard network.
          </p>
        </div>

        <div className="action-row">
          <button
            className="btn"
            onClick={loadDashboard}
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

          <button
            className="btn btn-primary"
            onClick={() =>
              router.push("/requests")
            }
          >
            View live requests →
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="Total Customers"
          value={stats.totalUsers}
          trend="Registered users"
          icon="U"
        />

        <StatCard
          label="Total Mechanics"
          value={stats.totalMechanics}
          trend="Network capacity"
          icon="M"
        />

        <StatCard
          label="Active Requests"
          value={stats.activeRequests}
          accent="active"
          trend="Needs attention now"
          icon="!"
        />

        <StatCard
          label="Completed Today"
          value={stats.completedToday}
          accent="completed"
          trend="Resolved successfully"
          icon="✓"
        />

        <StatCard
          label="Pending Verification"
          value={stats.pendingVerifications}
          accent="pending"
          trend="Review queue"
          icon="⌁"
        />

        <StatCard
          label="Total Revenue"
          value={`₹${stats.totalRevenue}`}
          trend="Gross service value"
          icon="₹"
        />

        <StatCard
          label="Platform Fees"
          value={`₹${stats.platformEarnings}`}
          trend="Platform earnings"
          icon="%"
        />

        <StatCard
          label="Network Status"
          value="LIVE"
          accent="completed"
          trend="API connected"
          icon="●"
        />
      </div>

      <div className="dashboard-grid">
        <section className="surface-panel">
          <div className="panel-head">
            <div>
              <h3>Dispatch activity</h3>

              <span className="panel-sub">
                Requests over the current operating
                window
              </span>
            </div>

            <span className="badge badge--active">
              ● LIVE
            </span>
          </div>

          <div
            className="signal-bars"
            aria-label="Dispatch activity"
          >
            {bars.map((height, index) => (
              <i
                key={index}
                style={{
                  height: `${height}%`,
                }}
              />
            ))}
          </div>
        </section>

        <section className="surface-panel">
          <div className="panel-head">
            <div>
              <h3>Control checklist</h3>

              <span className="panel-sub">
                Operational readiness
              </span>
            </div>

            <span className="badge badge--active">
              READY
            </span>
          </div>

          <div className="mini-list">
            <div className="mini-row">
              <span>API gateway</span>
              <b style={{ color: "rgb(var(--green))" }}>
                Healthy
              </b>
            </div>

            <div className="mini-row">
              <span>Authentication</span>
              <b style={{ color: "rgb(var(--green))" }}>
                Healthy
              </b>
            </div>

            <div className="mini-row">
              <span>Dispatch queue</span>
              <b style={{ color: "rgb(var(--blue))" }}>
                Online
              </b>
            </div>

            <div className="mini-row">
              <span>Database</span>
              <b style={{ color: "rgb(var(--green))" }}>
                Connected
              </b>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}