type StatCardProps = {
  label: string;
  value: string | number;
  accent?: "pending" | "active" | "completed" | "cancelled";
  trend?: string;
  icon?: string;
};

const ACCENT: Record<
  NonNullable<StatCardProps["accent"]>,
  string
> = {
  pending: "stat-pending",
  active: "stat-active",
  completed: "stat-completed",
  cancelled: "stat-cancelled",
};

export function StatCard({
  label,
  value,
  accent,
  trend,
  icon = "•",
}: StatCardProps) {
  return (
    <article
      className={`stat-card ${accent ? ACCENT[accent] : ""
        }`}
    >
      <div className="stat-top">
        <span className="stat-icon">{icon}</span>

        <span className="stat-label">
          {label}
        </span>
      </div>

      <div className="stat-value">
        {value}
      </div>

      {trend && (
        <div className="stat-trend">
          {trend}
        </div>
      )}
    </article>
  );
}