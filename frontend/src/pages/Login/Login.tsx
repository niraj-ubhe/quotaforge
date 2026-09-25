import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { notify } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      notify("Signed in successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <div className="brand-lockup">
          <span className="brand-mark">QF</span>
          <div className="auth-brand-copy">
            <h1>QuotaForge</h1>
            <p>Developer API management platform</p>
          </div>
        </div>
        <div className="auth-heading">
          <p className="auth-eyebrow">Welcome back</p>
          <h2>Sign in to your workspace</h2>
          <p className="auth-copy">Access your gateway, keys, and analytics.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <FormField
            label="Email"
            name="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
          <FormField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            endAdornment={
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            }
          />
          {error && <p className="form-banner error">{error}</p>}
          <Button className="auth-submit" type="submit" loading={loading}>
            Sign in
          </Button>
        </form>
        <p className="auth-footer">
          <span>Need an account?</span> <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
