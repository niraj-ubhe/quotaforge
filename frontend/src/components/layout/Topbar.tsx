import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Button from "../common/Button";

interface TopbarProps {
  onMenu: () => void;
  theme: "dark" | "light";
  onThemeToggle: () => void;
}

export default function Topbar({ onMenu, theme, onThemeToggle }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-button menu-button"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>
      <div className="topbar-status">
        <span className="status-dot" />
        Local environment
      </div>
      <div className="user-section">
        <button
          type="button"
          className="icon-button theme-toggle"
          onClick={onThemeToggle}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="user-meta">
          <span className="user-name">{user?.name ?? "Account"}</span>
          <span className="user-email">{user?.email}</span>
        </div>
        <Button variant="secondary" type="button" onClick={logout}>
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </header>
  );
}
