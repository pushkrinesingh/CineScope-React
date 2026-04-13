import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PageNotFound.css";

function PageNotFound() {
  const navigate = useNavigate();
  const [count, setCount] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => prev - 1);
    }, 1000);

    const timer = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="notfound-container">
     <div className="notfound-box">
         <h1>404</h1>
      <h2>Page Not Found</h2>

      <p>
        Redirecting in{" "}
        <span className="countdown">{count}</span> seconds...
      </p>

      <button onClick={() => navigate("/")}>
        Go to Home
      </button>
     </div>
    </div>
  );
}

export default PageNotFound;