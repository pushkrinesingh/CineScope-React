import { useContext, useEffect } from "react";
import { MovieContext } from "./Router";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
function ProtectedRoute({ children }) {
  const { user, loading } = useContext(MovieContext);
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user && location.pathname !== "/login") {
      toast.warning("Please login first ⚠️");
    }
  }, [user, loading]);

  if (loading) {
    return <div className="auth-loader">Checking authentication... </div>;
  }

  if (!user) {
    return <Navigate to={`/login?next=${location.pathname}`} replace />;
  }

  return children;
}

export default ProtectedRoute;
