import { useEffect, useState, type FormEvent } from "react";
import PageHeader from "../../components/common/PageHeader";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import AlgorithmBadge from "../../components/common/AlgorithmBadge";
import { createApi, listApis, updateApi } from "../../services/api.service";
import { useToast } from "../../context/ToastContext";
import type { Api, RateLimitAlgorithm } from "../../types";
import { getApiBaseUrl } from "../../services/apiClient";

export default function APIs() {
  const { notify } = useToast();
  const [apis, setApis] = useState<Api[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [description, setDescription] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const [configApi, setConfigApi] = useState<Api | null>(null);
  const [editApi, setEditApi] = useState<Api | null>(null);
  const [requestsPerMinute, setRequestsPerMinute] = useState(100);
  const [algorithm, setAlgorithm] =
    useState<RateLimitAlgorithm>("FIXED_WINDOW");
  const [savingConfig, setSavingConfig] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBaseUrl, setEditBaseUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await listApis();
      setApis(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load APIs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 3) next.name = "Name must be at least 3 characters.";
    try {
      new URL(baseUrl);
    } catch {
      next.baseUrl = "Enter a valid URL, including https://";
    }
    setFormErrors(next);
    if (Object.keys(next).length) return;

    setCreating(true);
    try {
      await createApi({
        name: name.trim(),
        baseUrl: baseUrl.trim(),
        description: description.trim() || undefined,
      });
      notify("API created successfully");
      setName("");
      setBaseUrl("");
      setDescription("");
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to create API", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveConfig() {
    if (!configApi) return;
    if (requestsPerMinute < 1) {
      notify("Requests per minute must be at least 1", "error");
      return;
    }
    setSavingConfig(true);
    try {
      await updateApi(configApi.id, {
        requestsPerMinute,
        rateLimitAlgorithm: algorithm,
      });
      notify("Rate limit configuration saved");
      setConfigApi(null);
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleSaveEdit() {
    if (!editApi) return;
    if (editName.trim().length < 3) {
      notify("Name must be at least 3 characters", "error");
      return;
    }
    try {
      new URL(editBaseUrl);
    } catch {
      notify("Enter a valid URL", "error");
      return;
    }
    setSavingEdit(true);
    try {
      await updateApi(editApi.id, {
        name: editName.trim(),
        baseUrl: editBaseUrl.trim(),
      });
      notify("API updated successfully");
      setEditApi(null);
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to update API", "error");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <>
      <PageHeader
        title="APIs"
        description="Register upstream services and configure gateway rate limits."
      />

      <section className="panel">
        <h2>Register API</h2>
        <form className="form-grid" onSubmit={handleCreate} noValidate>
          <FormField
            label="API name"
            name="name"
            placeholder="Payments API"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={formErrors.name}
          />
          <FormField
            label="Base URL"
            name="baseUrl"
            type="url"
            placeholder="https://api.example.com"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            error={formErrors.baseUrl}
          />
          <FormField
            label="Description (optional)"
            name="description"
            placeholder="Production payments upstream"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="form-actions">
            <Button type="submit" loading={creating}>
              Register API
            </Button>
          </div>
        </form>
      </section>

      {loading && <Spinner label="Loading APIs..." />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && (
        <section className="panel">
          <h2>Registered APIs</h2>
          {apis.length === 0 ? (
            <EmptyState
              title="No APIs registered yet"
              description="Create an API above to generate keys and collect analytics."
            />
          ) : (
            <div className="card-list">
              {apis.map((api) => (
                <article key={api.id} className="entity-card">
                  <div className="entity-card-main">
                    <div className="entity-title-row">
                      <h3>{api.name}</h3>
                      <AlgorithmBadge algorithm={api.rateLimitAlgorithm} />
                      <span className="badge badge-neutral">
                        {api.requestsPerMinute} req/min
                      </span>
                    </div>
                    <p className="mono">{api.baseUrl}</p>
                    <p className="meta">
                      API ID <span className="mono">{api.id}</span>
                    </p>
                    <p className="meta">
                      Gateway path{" "}
                      <span className="mono">
                        {getApiBaseUrl()}/gateway/{api.id}/
                      </span>
                    </p>
                  </div>
                  <div className="entity-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setConfigApi(api);
                        setRequestsPerMinute(api.requestsPerMinute);
                        setAlgorithm(api.rateLimitAlgorithm);
                      }}
                    >
                      Configure Rate Limit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditApi(api);
                        setEditName(api.name);
                        setEditBaseUrl(api.baseUrl);
                      }}
                    >
                      Edit API
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <Modal
        title="Rate Limit Configuration"
        open={Boolean(configApi)}
        onClose={() => setConfigApi(null)}
      >
        <div className="form-group">
          <label htmlFor="algorithm">Algorithm</label>
          <select
            id="algorithm"
            value={algorithm}
            onChange={(event) =>
              setAlgorithm(event.target.value as RateLimitAlgorithm)
            }
          >
            <option value="FIXED_WINDOW">Fixed Window</option>
            <option value="SLIDING_WINDOW">Sliding Window</option>
            <option value="TOKEN_BUCKET">Token Bucket</option>
          </select>
        </div>
        <FormField
          label="Requests per minute"
          name="requestsPerMinute"
          type="number"
          min={1}
          value={requestsPerMinute}
          onChange={(event) =>
            setRequestsPerMinute(Number(event.target.value))
          }
        />
        {algorithm === "TOKEN_BUCKET" && (
          <p className="field-hint">
            Estimated refill rate: {(requestsPerMinute / 60).toFixed(3)}{" "}
            requests/sec
          </p>
        )}
        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setConfigApi(null)}
          >
            Cancel
          </Button>
          <Button type="button" loading={savingConfig} onClick={handleSaveConfig}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal
        title="Edit API"
        open={Boolean(editApi)}
        onClose={() => setEditApi(null)}
      >
        <FormField
          label="API name"
          name="editName"
          value={editName}
          onChange={(event) => setEditName(event.target.value)}
        />
        <FormField
          label="Base URL"
          name="editBaseUrl"
          type="url"
          value={editBaseUrl}
          onChange={(event) => setEditBaseUrl(event.target.value)}
        />
        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setEditApi(null)}
          >
            Cancel
          </Button>
          <Button type="button" loading={savingEdit} onClick={handleSaveEdit}>
            Save
          </Button>
        </div>
      </Modal>
    </>
  );
}
