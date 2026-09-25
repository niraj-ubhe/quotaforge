import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import AppLayout from "./layouts/AppLayout";
import Spinner from "./components/common/Spinner";

export function ProtectedRoute() {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return (
      <div className="boot-screen">
        <Spinner label="Loading QuotaForge..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

export function PublicOnly() {
  const { isReady, isAuthenticated } = useAuth();
  if (!isReady) {
    return (
      <div className="boot-screen">
        <Spinner label="Loading QuotaForge..." />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
