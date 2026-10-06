"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";

import { api } from "../../lib/api";
import { StatCard } from "../../components/StatCard";

export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);

  async function loadDashboard() {
    try {
      setRefreshing(true);
      setError("");

      const [dashboardResponse, requestResponse] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/requests"),
      ]);
      setStats(dashboardResponse.data.data);
      setRecentRequests(requestResponse.data.data.slice(0, 6));
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
    const refreshTimer = window.setInterval(loadDashboard, 15000);
    const token = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("adminToken="))
      ?.split("=")[1];
    const socket: Socket | undefined = token
      ? io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000", {
        auth: { token: decodeURIComponent(token) },
        reconnection: true,
      })
      : undefined;
    const handleActivity = (event: any) => {
      setActivity((previous) => [event, ...previous].slice(0, 8));
      if (!["CHAT_MESSAGE", "MECHANIC_AVAILABILITY_CHANGED"].includes(event.type)) {
        void loadDashboard();
      }
    };
    socket?.on("connect", () => setLiveConnected(true));
    socket?.on("disconnect", () => setLiveConnected(false));
    socket?.on("admin:activity", handleActivity);
    return () => {
      window.clearInterval(refreshTimer);
      socket?.off("admin:activity", handleActivity);
      socket?.disconnect();
    };
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

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Control room</h2>

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
          value={liveConnected ? "LIVE" : "RECONNECTING"}
          accent={liveConnected ? "completed" : "pending"}
          trend={liveConnected ? "Live events connected" : "Waiting for live connection"}
          icon="●"
        />
      </div>

      <div className="dashboard-grid">
        <section className="surface-panel quick-actions-panel">
          <div className="panel-head">
            <div>
              <h3>Operations</h3>

              <span className="panel-sub">
                Manage the live RoadGuard network
              </span>
            </div>

            <span className="badge badge--active">
              ● LIVE
            </span>
          </div>

          <div className="operations-links">
            <button className="operation-link" onClick={() => router.push("/requests")}><span className="operation-icon operation-icon--blue">↯</span><span><strong>Service requests</strong><small>Track current dispatches</small></span><b>→</b></button>
            <button className="operation-link" onClick={() => router.push("/mechanics")}><span className="operation-icon operation-icon--green">⚒</span><span><strong>Mechanic network</strong><small>Review verification queue</small></span><b>→</b></button>
            <button className="operation-link" onClick={() => router.push("/pricing")}><span className="operation-icon operation-icon--violet">₹</span><span><strong>Pricing controls</strong><small>Service fares and tax rules</small></span><b>→</b></button>
          </div>
        </section>

        <section className="surface-panel recent-requests-panel">
          <div className="panel-head">
            <div><h3>Recent requests</h3><span className="panel-sub">Latest activity across the network</span></div>
            <button className="btn" onClick={() => router.push("/requests")}>View all →</button>
          </div>
          <div className="rg-table-wrap dashboard-table-wrap">
            <table className="rg-table dashboard-table">
              <thead><tr><th>Service</th><th>Customer</th><th>Mechanic</th><th>Status</th><th>Fare</th></tr></thead>
              <tbody>{recentRequests.map((request) => (
                <tr key={request.id}>
                  <td><strong>{request.category?.replaceAll("_", " ")}</strong></td>
                  <td>{request.customer?.fullName ?? "—"}</td>
                  <td>{request.mechanic?.user?.fullName ?? "Unassigned"}</td>
                  <td><span className={`badge ${request.status === "PENDING" ? "badge--pending" : request.status === "COMPLETED" ? "badge--completed" : "badge--active"}`}>{request.status?.replaceAll("_", " ")}</span></td>
                  <td>₹{request.finalFare ?? request.agreedFare ?? request.estimatedFare ?? "—"}</td>
                </tr>
              ))}</tbody>
            </table>
            {recentRequests.length === 0 && <div className="empty-state">No service requests yet.</div>}
          </div>
        </section>
      </div>

      <section className="surface-panel live-activity-panel">
        <div className="panel-head">
          <div><h3>Live activity</h3><span className="panel-sub">Customer, mechanic, request and payment events</span></div>
          <span className={`badge ${liveConnected ? "badge--completed" : "badge--pending"}`}>{liveConnected ? "● CONNECTED" : "○ RECONNECTING"}</span>
        </div>
        {activity.length ? (
          <ol className="live-activity-list">
            {activity.map((event, index) => (
              <li className="live-activity-item" key={`${event.type}-${event.request?.id ?? "payment"}-${event.timestamp}-${index}`}>
                <span className="live-activity-marker" />
                <div><strong>{formatActivity(event)}</strong><small>{event.request?.category?.replaceAll("_", " ") ?? "Service event"} · Request {event.request?.id ?? "—"}</small></div>
                <time>{new Date(event.timestamp ?? Date.now()).toLocaleTimeString()}</time>
              </li>
            ))}
          </ol>
        ) : <div className="empty-state">Waiting for customer and mechanic activity.</div>}
      </section>
    </div>
  );
}

function formatActivity(event: any) {
  if (event.type === "REQUEST_STATUS_CHANGED") return `Request ${event.previousStatus?.replaceAll("_", " ")} → ${event.request?.status?.replaceAll("_", " ")}`;
  if (event.type === "REQUEST_CREATED") return `New request · ${event.request?.status?.replaceAll("_", " ")}`;
  if (event.type === "FARE_OFFER_UPDATED") return "Customer updated fare offer";
  if (event.type === "FARE_OFFER_ACCEPTED") return "Mechanic accepted fare offer";
  if (event.type === "FARE_OFFER_REJECTED") return "Mechanic declined fare offer";
  if (event.type === "PAYMENT_STARTED") return "Payment started";
  if (event.type === "PAYMENT_CONFIRMED") return "Payment confirmed";
  if (event.type === "MECHANIC_AVAILABILITY_CHANGED") return `Mechanic went ${event.isOnline ? "online" : "offline"}`;
  if (event.type === "CHAT_MESSAGE") return `${event.senderRole ?? "User"} sent a chat message`;
  return event.type?.replaceAll("_", " ") ?? "RoadGuard update";
}