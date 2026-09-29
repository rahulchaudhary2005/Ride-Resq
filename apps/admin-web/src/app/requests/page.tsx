"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

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
                  <th>Status</th>
                  <th>Fare</th>
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