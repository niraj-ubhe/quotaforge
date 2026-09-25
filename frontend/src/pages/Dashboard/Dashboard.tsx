import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  KeyRound,
  Server,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Spinner from "../../components/common/Spinner";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { listApis } from "../../services/api.service";
import { listApiKeys } from "../../services/apiKey.service";
import { getOverview } from "../../services/analytics.service";
import type { AnalyticsOverview, Api, ApiKey } from "../../types";
import { formatDate } from "../../utils/format";

export default function Dashboard() {
  const [apis, setApis] = useState<Api[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [apiRes, keyRes, overviewRes] = await Promise.all([
        listApis(),
        listApiKeys(),
        getOverview(),
      ]);
      setApis(apiRes.data);
      setKeys(keyRes.data);
      setOverview(overviewRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const activeKeys = keys.filter((key) => key.isActive).length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live snapshot of your APIs, credentials, and traffic."
      />

      {loading && <Spinner label="Loading dashboard..." />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && overview && (
        <>
          <div className="stats-grid">
            <StatCard
              title="Total APIs"
              value={apis.length}
              icon={<Server size={18} />}
            />
            <StatCard
              title="Active API Keys"
              value={activeKeys}
              hint={`${keys.length} total keys`}
              icon={<KeyRound size={18} />}
            />
            <StatCard
              title="Total Requests"
              value={overview.totalRequests}
              hint="All recorded gateway traffic"
              icon={<Activity size={18} />}
            />
            <StatCard
              title="Failed Requests"
              value={overview.failedRequests}
              icon={<AlertTriangle size={18} />}
            />
          </div>

          <div className="split-grid">
            <section className="panel">
              <div className="panel-header">
                <h2>Quick actions</h2>
              </div>
              <div className="action-row">
                <Link to="/apis">
                  <Button type="button">Register API</Button>
                </Link>
                <Link to="/api-keys">
                  <Button type="button" variant="secondary">
                    Create API Key
                  </Button>
                </Link>
                <Link to="/analytics">
                  <Button type="button" variant="ghost">
                    View Analytics
                  </Button>
                </Link>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Recent APIs</h2>
              </div>
              {apis.length === 0 ? (
                <EmptyState
                  title="No APIs yet"
                  description="Register your first upstream API to start issuing keys."
                  action={
                    <Link to="/apis">
                      <Button type="button">Register API</Button>
                    </Link>
                  }
                />
              ) : (
                <ul className="compact-list">
                  {apis.slice(0, 5).map((api) => (
                    <li key={api.id}>
                      <div>
                        <strong>{api.name}</strong>
                        <p>{api.baseUrl}</p>
                      </div>
                      <span className="meta">{formatDate(api.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
