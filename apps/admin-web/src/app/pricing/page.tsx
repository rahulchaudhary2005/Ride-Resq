"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function PricingPage() {
  const [pricing, setPricing] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState("");

  async function load() {
    setLoading(true);

    try {
      const { data } =
        await api.get("/admin/pricing");

      setPricing(data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function update(
    row: any,
    field: string,
    value: number
  ) {
    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      return;
    }

    setSaving(row.category + field);

    try {
      await api.put(
        "/admin/pricing",
        {
          category: row.category,

          baseFare:
            field === "baseFare"
              ? value
              : row.baseFare,

          perKmRate:
            field === "perKmRate"
              ? value
              : row.perKmRate,

          minFare:
            field === "minFare"
              ? value
              : row.minFare,

          surgeMultiplier:
            row.surgeMultiplier,
        }
      );

      await load();
    } finally {
      setSaving("");
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Service pricing</h2>

          <p>
            Adjust fares used by the RoadGuard
            dispatch engine.
          </p>
        </div>

        <button
          className="btn"
          onClick={load}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="rg-table-wrap">
        <table
          className="rg-table"
          style={{
            minWidth: 760,
          }}
        >
          <thead>
            <tr>
              <th>Category</th>
              <th>Base fare</th>
              <th>Per KM</th>
              <th>Minimum fare</th>
              <th>Surge</th>
            </tr>
          </thead>

          <tbody>
            {pricing.map((row) => (
              <tr key={row.category}>
                <td>
                  <strong>
                    {row.category.replaceAll(
                      "_",
                      " "
                    )}
                  </strong>
                </td>

                {[
                  "baseFare",
                  "perKmRate",
                  "minFare",
                ].map((field) => (
                  <td key={field}>
                    <input
                      className="field"
                      style={{
                        width: 110,
                      }}
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={
                        row[field]
                      }
                      disabled={
                        saving ===
                        row.category + field
                      }
                      onBlur={(e) =>
                        update(
                          row,
                          field,
                          Number(
                            e.target.value
                          )
                        )
                      }
                    />
                  </td>
                ))}

                <td>
                  <span className="badge badge--active">
                    {row.surgeMultiplier}x
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="empty-state">
            Loading pricing
            <span className="loading-dots" />
          </div>
        )}

        {!loading &&
          pricing.length === 0 && (
            <div className="empty-state">
              No pricing rules configured.
            </div>
          )}
      </div>
    </div>
  );
}