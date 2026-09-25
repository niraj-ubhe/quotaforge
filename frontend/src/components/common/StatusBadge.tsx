export default function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`badge ${active ? "badge-success" : "badge-danger"}`}>
      {active ? "ACTIVE" : "REVOKED"}
    </span>
  );
}
