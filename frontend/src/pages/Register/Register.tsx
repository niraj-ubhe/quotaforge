import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";

export default function Register() {
  const { register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (name.trim().length < 2) nextErrors.name = "Enter your name.";
    if (!email.includes("@")) nextErrors.email = "Enter a valid email.";
    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      notify("Account created. You can now sign in.");
      navigate("/login");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed");
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
            <p>Create your control-plane account</p>
          </div>
        </div>
        <div className="auth-heading">
          <p className="auth-eyebrow">Get started</p>
          <h2>Create your workspace</h2>
          <p className="auth-copy">Set up your account and start managing APIs.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <FormField
            label="Name"
            name="name"
            placeholder="Ada Lovelace"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errors.name}
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
          <FormField
            label="Password"
            name="password"
            type={showPasswords ? "text" : "password"}
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            endAdornment={
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPasswords((visible) => !visible)}
                aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
              >
                {showPasswords ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            }
          />
          <FormField
            label="Confirm password"
            name="confirmPassword"
            type={showPasswords ? "text" : "password"}
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={errors.confirmPassword}
            endAdornment={
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPasswords((visible) => !visible)}
                aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
              >
                {showPasswords ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            }
          />
          {formError && <p className="form-banner error">{formError}</p>}
          <Button className="auth-submit" type="submit" loading={loading}>
            Create account
          </Button>
        </form>
        <p className="auth-footer">
          <span>Already registered?</span> <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
