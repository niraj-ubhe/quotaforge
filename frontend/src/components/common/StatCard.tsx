import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}

export default function StatCard({ title, value, hint, icon }: StatCardProps) {
  return (
    <article className="stats-card">
      <div className="stats-card-top">
        <p className="stats-title">{title}</p>
        {icon && <span className="stats-icon">{icon}</span>}
      </div>
      <h2>{value}</h2>
      {hint && <p className="stats-hint">{hint}</p>}
    </article>
  );
}
