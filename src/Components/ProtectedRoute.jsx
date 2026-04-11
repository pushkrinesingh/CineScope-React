import { useContext } from "react";
import { MovieContext } from "./Router";
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { user } = useContext(MovieContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to={`/login?next=${location.pathname}`} replace />;
  }

  return children;
}

export default ProtectedRoute;