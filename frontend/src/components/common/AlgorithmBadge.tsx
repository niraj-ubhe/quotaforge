import type { RateLimitAlgorithm } from "../../types";
import { algorithmLabel } from "../../utils/format";

export default function AlgorithmBadge({
  algorithm,
}: {
  algorithm: RateLimitAlgorithm;
}) {
  return <span className="badge badge-info">{algorithmLabel(algorithm)}</span>;
}
