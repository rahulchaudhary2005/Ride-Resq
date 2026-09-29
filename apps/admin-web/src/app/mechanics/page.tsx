"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function MechanicsPage() {
  const [pending, setPending] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState("");

  const [error, setError] =
    useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const { data } =
        await api.get(
          "/admin/mechanics",
          {
            params: {
              status: "PENDING",
            },
          }
        );

      setPending(data.data);
    } catch {
      setError(
        "Unable to load mechanic verification queue."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function review(
    id: string,
    approve: boolean
  ) {
    setBusy(id);

    try {
      await api.patch(
        `/admin/mechanics/${id}/verification`,
        {
          status: approve
            ? "APPROVED"
            : "REJECTED",
        }
      );

      await load();
    } catch {
      setError(
        "Unable to update mechanic verification."
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Mechanic network</h2>

          <p>
            Review professionals waiting for
            verification.
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
        {pending.map((mechanic) => (
          <article
            key={mechanic.id}
            className="surface-panel"
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div className="avatar">
                    {mechanic.user?.fullName
                      ?.slice(0, 2)
                      .toUpperCase() ||
                      "ME"}
                  </div>

                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 14,
                      }}
                    >
                      {mechanic.user.fullName}
                    </h3>

                    <span className="badge badge--pending">
                      PENDING
                    </span>
                  </div>
                </div>

                <p className="muted">
                  {mechanic.user.email} ·{" "}
                  {mechanic.user.phone}
                </p>

                <p
                  className="muted"
                  style={{
                    margin: 0,
                    fontSize: 10,
                  }}
                >
                  License:{" "}
                  {mechanic.licenseNumber ??
                    "Not provided"}
                </p>
              </div>

              <div className="action-row">
                <button
                  className="btn btn-primary"
                  disabled={
                    busy === mechanic.id
                  }
                  onClick={() =>
                    review(
                      mechanic.id,
                      true
                    )
                  }
                >
                  {busy === mechanic.id
                    ? "Saving..."
                    : "✓ Approve"}
                </button>

                <button
                  className="btn"
                  disabled={
                    busy === mechanic.id
                  }
                  onClick={() =>
                    review(
                      mechanic.id,
                      false
                    )
                  }
                >
                  Reject
                </button>
              </div>
            </div>
          </article>
        ))}

        {loading && (
          <div className="surface-panel empty-state">
            Loading verification queue
            <span className="loading-dots" />
          </div>
        )}

        {!loading &&
          pending.length === 0 && (
            <div className="surface-panel empty-state">
              <div style={{ fontSize: 28 }}>
                ✓
              </div>

              No pending mechanic
              verifications.
            </div>
          )}
      </div>
    </div>
  );
}