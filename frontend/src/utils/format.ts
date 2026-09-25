export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMs(value: number) {
  if (!Number.isFinite(value)) return "0 ms";
  return `${value.toFixed(2)} ms`;
}

export function algorithmLabel(algorithm: string) {
  switch (algorithm) {
    case "FIXED_WINDOW":
      return "Fixed Window";
    case "SLIDING_WINDOW":
      return "Sliding Window";
    case "TOKEN_BUCKET":
      return "Token Bucket";
    default:
      return algorithm;
  }
}
