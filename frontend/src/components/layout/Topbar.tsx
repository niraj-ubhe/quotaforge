import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Button from "../common/Button";

interface TopbarProps {
  onMenu: () => void;
}

export default function Topbar({ onMenu }: TopbarProps) {
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
