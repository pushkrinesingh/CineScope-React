import { Component } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Router from "./Components/Router";
import { BrowserRouter } from "react-router-dom";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#fff", background: "#0d0d0d", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Something went wrong</h1>
          <p style={{ color: "#999", marginBottom: "1.5rem" }}>An unexpected error occurred. Please try refreshing the page.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = "/"; }}
            style={{ padding: "0.75rem 2rem", background: "#e50914", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" }}
          >
            Go to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

document.documentElement.setAttribute("data-theme", "dark");
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  </BrowserRouter>,
);
