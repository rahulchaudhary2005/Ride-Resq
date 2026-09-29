"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function SupportPage() {
  const [tickets, setTickets] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const { data } =
        await api.get(
          "/admin/support-tickets"
        );

      setTickets(data.data);
    } catch {
      setError(
        "Unable to load support tickets."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Support center</h2>

          <p>
            Customer issues and roadside
            assistance conversations.
          </p>
        </div>

        <button
          className="btn"
          onClick={load}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="login-error">
          ⚠ {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: 12,
          marginTop: 15,
        }}
      >
        {tickets.map((ticket) => (
          <article
            key={ticket.id}
            className="surface-panel"
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "flex-start",
                gap: 15,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 14,
                  }}
                >
                  {ticket.subject}
                </h3>

                <p
                  className="muted"
                  style={{
                    lineHeight: 1.7,
                    fontSize: 11,
                  }}
                >
                  {ticket.message}
                </p>
              </div>

              <span className="badge badge--active">
                {ticket.status}
              </span>
            </div>

            <div
              className="muted"
              style={{
                marginTop: 15,
                fontSize: 9,
              }}
            >
              {ticket.user?.fullName ??
                "Customer"}{" "}
              ·{" "}
              {new Date(
                ticket.createdAt
              ).toLocaleString()}
            </div>
          </article>
        ))}

        {loading && (
          <div className="surface-panel empty-state">
            Loading support tickets
            <span className="loading-dots" />
          </div>
        )}

        {!loading &&
          tickets.length === 0 && (
            <div className="surface-panel empty-state">
              No support tickets.
            </div>
          )}
      </div>
    </div>
  );
}