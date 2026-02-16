import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Project from "./pages/Project";
import JobDetail from "./pages/JobDetail";
import Experiments from "./pages/Experiments";
import Artifacts from "./pages/Artifacts";
import Agent from "./pages/Agent";

function App() {
  const { user, loading, signInWithGitHub, signOut } = useAuth();

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <h1 style={styles.logo}>Gamma</h1>
        <p style={styles.tagline}>ML Development Platform</p>
        <button style={styles.loginButton} onClick={signInWithGitHub}>
          Sign in with GitHub
        </button>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <Link to="/" style={styles.navLogo}>
          Gamma
        </Link>
        <div style={styles.navRight}>
          <span style={styles.username}>
            {user.user_metadata?.user_name ?? user.email}
          </span>
          <button style={styles.signOutBtn} onClick={signOut}>
            Sign out
          </button>
        </div>
      </nav>
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects/:projectId" element={<Project />} />
          <Route path="/projects/:projectId/jobs/:jobId" element={<JobDetail />} />
          <Route path="/projects/:projectId/experiments" element={<Experiments />} />
          <Route path="/projects/:projectId/artifacts" element={<Artifacts />} />
          <Route path="/projects/:projectId/agent" element={<Agent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: 18 },
  loginContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16 },
  logo: { fontSize: 48, fontWeight: 700, letterSpacing: -1 },
  tagline: { fontSize: 18, color: "#666", marginBottom: 24 },
  loginButton: { padding: "12px 32px", fontSize: 16, background: "#24292e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" },
  app: { minHeight: "100vh", background: "#f5f5f5" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px", background: "#fff", borderBottom: "1px solid #e0e0e0" },
  navLogo: { fontSize: 24, fontWeight: 700, textDecoration: "none", color: "#000" },
  navRight: { display: "flex", alignItems: "center", gap: 12 },
  username: { fontSize: 14, color: "#555" },
  signOutBtn: { padding: "6px 12px", fontSize: 13, background: "none", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" },
  main: { maxWidth: 1200, margin: "0 auto", padding: 24 },
};

export default App;
