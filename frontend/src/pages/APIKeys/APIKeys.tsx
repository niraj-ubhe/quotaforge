import { useEffect, useState, type FormEvent } from "react";
import { Copy } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import StatusBadge from "../../components/common/StatusBadge";
import { listApis } from "../../services/api.service";
import {
  activateApiKey,
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from "../../services/apiKey.service";
import { useToast } from "../../context/ToastContext";
import type { Api, ApiKey } from "../../types";
import { formatDate } from "../../utils/format";

export default function APIKeys() {
  const { notify } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [apis, setApis] = useState<Api[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [apiId, setApiId] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState("");
  const [pending, setPending] = useState<{
    id: string;
    action: "revoke" | "activate";
  } | null>(null);
  const [working, setWorking] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [keyRes, apiRes] = await Promise.all([listApiKeys(), listApis()]);
      setKeys(keyRes.data);
      setApis(apiRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
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
    if (!apiId) next.apiId = "Select an API.";
    setFormErrors(next);
    if (Object.keys(next).length) return;

    setCreating(true);
    try {
      const response = await createApiKey({ apiId, name: name.trim() });
      setCreatedKey(response.data.key);
      setName("");
      notify("API key created successfully");
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to create key", "error");
    } finally {
      setCreating(false);
    }
  }

  async function confirmPending() {
    if (!pending) return;
    setWorking(true);
    try {
      if (pending.action === "revoke") {
        await revokeApiKey(pending.id);
        notify("API key revoked successfully");
      } else {
        await activateApiKey(pending.id);
        notify("API key activated successfully");
      }
      setPending(null);
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Action failed", "error");
    } finally {
      setWorking(false);
    }
  }

  function apiName(id: string) {
    return apis.find((api) => api.id === id)?.name ?? id;
  }

  return (
    <>
      <PageHeader
        title="API Keys"
        description="Issue credentials for the gateway. Keys are shown only once at creation."
      />

      <section className="panel">
        <h2>Create API Key</h2>
        <form className="form-grid" onSubmit={handleCreate} noValidate>
          <FormField
            label="Key name"
            name="keyName"
            placeholder="Production API Key"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={formErrors.name}
          />
          <div className="form-group">
            <label htmlFor="apiId">API</label>
            <select
              id="apiId"
              value={apiId}
              onChange={(event) => setApiId(event.target.value)}
            >
              <option value="">Select an API</option>
              {apis.map((api) => (
                <option key={api.id} value={api.id}>
                  {api.name}
                </option>
              ))}
            </select>
            {formErrors.apiId && (
              <p className="field-error">{formErrors.apiId}</p>
            )}
          </div>
          <div className="form-actions">
            <Button type="submit" loading={creating}>
              + Create API Key
            </Button>
          </div>
        </form>

        {createdKey && (
          <div className="secret-banner">
            <div>
              <h3>New API key</h3>
              <p className="mono secret-value">{createdKey}</p>
              <p className="meta">
                Store this key now. QuotaForge only keeps a hash after this.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(createdKey);
                notify("API key copied", "info");
              }}
            >
              <Copy size={16} />
              Copy key
            </Button>
          </div>
        )}
      </section>

      {loading && <Spinner label="Loading API keys..." />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && (
        <section className="panel">
          <h2>Issued keys</h2>
          {keys.length === 0 ? (
            <EmptyState
              title="No API keys created yet"
              description="Create a key and send it as the x-api-key header on gateway requests."
            />
          ) : (
            <div className="card-list">
              {keys.map((key) => (
                <article key={key.id} className="entity-card">
                  <div className="entity-card-main">
                    <div className="entity-title-row">
                      <h3>{key.name}</h3>
                      <StatusBadge active={key.isActive} />
                    </div>
                    <p className="meta">
                      Prefix <span className="mono">{key.prefix}</span>
                    </p>
                    <p className="meta">API {apiName(key.apiId)}</p>
                    <p className="meta">Created {formatDate(key.createdAt)}</p>
                  </div>
                  <div className="entity-actions">
                    {key.isActive ? (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() =>
                          setPending({ id: key.id, action: "revoke" })
                        }
                      >
                        Revoke
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() =>
                          setPending({ id: key.id, action: "activate" })
                        }
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <ConfirmDialog
        open={pending?.action === "revoke"}
        title="Revoke API Key?"
        description="This key will immediately stop authenticating requests."
        confirmLabel="Revoke Key"
        danger
        loading={working}
        onCancel={() => setPending(null)}
        onConfirm={confirmPending}
      />
      <ConfirmDialog
        open={pending?.action === "activate"}
        title="Activate API Key?"
        description="This key will be allowed to authenticate requests again."
        confirmLabel="Activate Key"
        loading={working}
        onCancel={() => setPending(null)}
        onConfirm={confirmPending}
      />
    </>
  );
}
