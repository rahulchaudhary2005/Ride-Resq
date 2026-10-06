"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { io, type Socket } from "socket.io-client";

const statuses = [
  "PENDING",
  "ACCEPTED",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_MECHANIC_FOUND",
];

function getBadge(status: string) {
  if (status === "PENDING") {
    return "badge badge--pending";
  }

  if (
    ["ACCEPTED", "ARRIVED", "IN_PROGRESS"].includes(
      status
    )
  ) {
    return "badge badge--active";
  }

  if (status === "COMPLETED") {
    return "badge badge--completed";
  }

  return "badge badge--cancelled";
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>(
    []
  );

  const [statusFilter, setStatusFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(
        "/admin/requests",
        {
          params: statusFilter
            ? { status: statusFilter }
            : {},
        }
      );

      setRequests(data.data);
    } catch {
      setError(
        "Unable to load service requests."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const refreshTimer = window.setInterval(load, 10000);
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
      if (!["CHAT_MESSAGE", "MECHANIC_AVAILABILITY_CHANGED"].includes(event.type)) void load();
    };
    const handleTracking = (position: any) => {
      setRequests((current) => current.map((request) => request.id === position.requestId
        ? { ...request, mechanic: request.mechanic ? { ...request.mechanic, currentLat: position.lat, currentLng: position.lng } : request.mechanic }
        : request));
    };
    socket?.on("admin:activity", handleActivity);
    socket?.on("admin:tracking", handleTracking);
    return () => {
      window.clearInterval(refreshTimer);
      socket?.off("admin:activity", handleActivity);
      socket?.off("admin:tracking", handleTracking);
      socket?.disconnect();
    };
  }, [statusFilter]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Service requests</h2>

          <p>
            Monitor roadside incidents and dispatch
            progress.
          </p>
        </div>

        <div className="action-row">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="">
              All statuses
            </option>

            {statuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <button
            className="btn"
            onClick={load}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="rg-table-wrap">
        {error && (
          <div className="empty-state">
            ⚠ {error}
          </div>
        )}

        {!error && (
          <>
            <table className="rg-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Customer</th>
                  <th>Mechanic</th>
                  <th>Mechanic location</th>
                  <th>Status</th>
                  <th>Fare</th>
                  <th>Payment</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <strong>
                        {request.category?.replaceAll(
                          "_",
                          " "
                        )}
                      </strong>
                    </td>

                    <td>
                      {request.customer?.fullName ??
                        "—"}
                    </td>

                    <td>
                      {request.mechanic?.user
                        ?.fullName ?? "Unassigned"}
                    </td>

                    <td>
                      {request.mechanic?.currentLat != null && request.mechanic?.currentLng != null
                        ? `${Number(request.mechanic.currentLat).toFixed(4)}, ${Number(request.mechanic.currentLng).toFixed(4)}`
                        : "No live fix"}
                    </td>

                    <td>
                      <span
                        className={getBadge(
                          request.status
                        )}
                      >
                        {request.status?.replaceAll(
                          "_",
                          " "
                        )}
                      </span>
                    </td>

                    <td>
                      ₹
                      {request.finalFare ??
                        request.estimatedFare ??
                        "—"}
                    </td>

                    <td>
                      <span className={`badge ${request.payment?.status === "PAID" ? "badge--completed" : request.payment?.status === "PENDING" ? "badge--pending" : "badge--cancelled"}`}>
                        {request.payment?.status ?? "NOT STARTED"}
                      </span>
                    </td>

                    <td>
                      {new Date(
                        request.createdAt
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {loading && (
              <div className="empty-state">
                Loading live requests
                <span className="loading-dots" />
              </div>
            )}

            {!loading &&
              requests.length === 0 && (
                <div className="empty-state">
                  No requests match this filter.
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}