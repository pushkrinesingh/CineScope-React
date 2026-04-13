import { useContext } from "react";
import { MovieContext } from "./Router";
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { user,loading } = useContext(MovieContext);
  const location = useLocation();
  if (loading) {
    return <div className="auth-loader">Checking authentication...  </div>;
  }

  if (!user) {
    return <Navigate to={`/login?next=${location.pathname}`} replace />;
  }

  return children;
}

export default ProtectedRoute;