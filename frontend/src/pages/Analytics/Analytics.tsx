import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Timer,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import { listApis } from "../../services/api.service";
import {
  getApiAnalytics,
  getStatusCodes,
  getTimeline,
  getTopEndpoints,
} from "../../services/analytics.service";
import type {
  AnalyticsOverview,
  Api,
  EndpointPoint,
  StatusCodePoint,
  TimelinePoint,
} from "../../types";
import { formatMs } from "../../utils/format";

export default function Analytics() {
  const [apis, setApis] = useState<Api[]>([]);
  const [selectedApiId, setSelectedApiId] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [statusCodes, setStatusCodes] = useState<StatusCodePoint[]>([]);
  const [topEndpoints, setTopEndpoints] = useState<EndpointPoint[]>([]);
  const [loadingApis, setLoadingApis] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadApis() {
      setLoadingApis(true);
      try {
        const response = await listApis();
        if (!cancelled) setApis(response.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load APIs");
        }
      } finally {
        if (!cancelled) setLoadingApis(false);
      }
    }
    void loadApis();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedApiId) {
      setAnalytics(null);
      setTimeline([]);
      setStatusCodes([]);
      setTopEndpoints([]);
      setLoadingAnalytics(false);
      return;
    }

    let cancelled = false;
    async function loadAnalytics() {
      setLoadingAnalytics(true);
      setError("");
      setAnalytics(null);
      setTimeline([]);
      setStatusCodes([]);
      setTopEndpoints([]);
      try {
        const [overviewRes, timelineRes, statusRes, endpointsRes] =
          await Promise.all([
            getApiAnalytics(selectedApiId),
            getTimeline(selectedApiId, "7d"),
            getStatusCodes(selectedApiId),
            getTopEndpoints(selectedApiId),
          ]);
        if (cancelled) return;
        setAnalytics(overviewRes.data);
        setTimeline(timelineRes.data);
        setStatusCodes(statusRes.data);
        setTopEndpoints(endpointsRes.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load analytics",
          );
          setAnalytics(null);
        }
      } finally {
        if (!cancelled) setLoadingAnalytics(false);
      }
    }

    void loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [selectedApiId]);

  const hasTraffic = Boolean(analytics && analytics.totalRequests > 0);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Detailed overview of your API traffic"
      />

      <div className="panel toolbar">
        <div className="form-group">
          <label htmlFor="analytics-api">Select API</label>
          <select
            id="analytics-api"
            value={selectedApiId}
            onChange={(event) => setSelectedApiId(event.target.value)}
            disabled={loadingApis}
          >
            <option value="">Select an API</option>
            {apis.map((api) => (
              <option key={api.id} value={api.id}>
                {api.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedApiId && !error && (
        <EmptyState
          title="Select an API to view analytics"
          description="Metrics and charts load only for the API you choose, so numbers never mix across services."
        />
      )}

      {error && <ErrorState message={error} />}
      {selectedApiId && loadingAnalytics && (
        <Spinner label="Loading analytics..." />
      )}

      {selectedApiId && !loadingAnalytics && !error && analytics && (
        <>
          <div className="stats-grid">
            <StatCard
              title="Total Requests"
              value={analytics.totalRequests}
              icon={<Activity size={18} />}
            />
            <StatCard
              title="Successful"
              value={analytics.successfulRequests}
              icon={<CheckCircle size={18} />}
            />
            <StatCard
              title="Failed"
              value={analytics.failedRequests}
              icon={<AlertCircle size={18} />}
            />
            <StatCard
              title="Average Response Time"
              value={formatMs(analytics.averageResponseTime)}
              icon={<Timer size={18} />}
            />
          </div>

          {!hasTraffic && (
            <EmptyState
              title="No requests recorded yet"
              description="Send traffic through the gateway with an active API key to populate these charts."
            />
          )}

          {hasTraffic && (
            <div className="chart-grid">
              <section className="panel chart-panel">
                <h2>Request Timeline</h2>
                {timeline.length === 0 ? (
                  <p className="meta">No timeline points in the last 7 days.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={timeline}>
                      <defs>
                        <linearGradient id="traffic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(148,163,184,0.12)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) =>
                          new Date(date).toLocaleDateString()
                        }
                        stroke="#94a3b8"
                      />
                      <YAxis stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: "#151d2e",
                          border: "1px solid rgba(148,163,184,0.2)",
                          borderRadius: 8,
                        }}
                        labelFormatter={(date) =>
                          new Date(String(date)).toLocaleString()
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="requests"
                        stroke="#818cf8"
                        fill="url(#traffic)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </section>

              <section className="panel chart-panel">
                <h2>Status Codes</h2>
                {statusCodes.length === 0 ? (
                  <p className="meta">No status code data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={statusCodes}>
                      <CartesianGrid stroke="rgba(148,163,184,0.12)" />
                      <XAxis dataKey="statusCode" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: "#151d2e",
                          border: "1px solid rgba(148,163,184,0.2)",
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="requests" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </section>

              <section className="panel chart-panel chart-wide">
                <h2>Top Endpoints</h2>
                {topEndpoints.length === 0 ? (
                  <p className="meta">No endpoint data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={topEndpoints} layout="vertical">
                      <CartesianGrid stroke="rgba(148,163,184,0.12)" />
                      <XAxis type="number" stroke="#94a3b8" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="path"
                        width={160}
                        stroke="#94a3b8"
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#151d2e",
                          border: "1px solid rgba(148,163,184,0.2)",
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="requests" fill="#38bdf8" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </>
  );
}
