import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProjects } from "../hooks/useProjects";
import { createProject } from "../services/api";
import type { ProjectCreate } from "../types";

function Dashboard() {
  const { user } = useAuth();
  const { projects, loading, refetch } = useProjects(user?.id);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProjectCreate>({
    name: "",
    github_repo_full_name: "",
    github_installation_id: 0,
    s3_bucket: "",
  });

  const handleCreate = async () => {
    if (!user) return;
    await createProject(form, user.id);
    setShowForm(false);
    setForm({ name: "", github_repo_full_name: "", github_installation_id: 0, s3_bucket: "" });
    refetch();
  };

  return (
    <div>
      <div style={styles.header}>
        <h2>Projects</h2>
        <button style={styles.createBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Project"}
        </button>
      </div>

      {showForm && (
        <div style={styles.form}>
          <input
            style={styles.input}
            placeholder="Project name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="GitHub repo (owner/repo)"
            value={form.github_repo_full_name}
            onChange={(e) => setForm({ ...form, github_repo_full_name: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="GitHub App Installation ID"
            type="number"
            value={form.github_installation_id || ""}
            onChange={(e) =>
              setForm({ ...form, github_installation_id: parseInt(e.target.value) || 0 })
            }
          />
          <input
            style={styles.input}
            placeholder="S3 Bucket"
            value={form.s3_bucket}
            onChange={(e) => setForm({ ...form, s3_bucket: e.target.value })}
          />
          <button style={styles.submitBtn} onClick={handleCreate}>
            Create Project
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading projects...</p>
      ) : projects.length === 0 ? (
        <p style={styles.empty}>No projects yet. Create one to get started.</p>
      ) : (
        <div style={styles.grid}>
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} style={styles.card}>
              <h3 style={styles.cardTitle}>{project.name}</h3>
              <p style={styles.cardRepo}>{project.github_repo_full_name}</p>
              <p style={styles.cardDate}>
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  createBtn: { padding: "8px 16px", fontSize: 14, background: "#000", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  form: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 24, padding: 20, background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0" },
  input: { padding: "10px 12px", fontSize: 14, border: "1px solid #ddd", borderRadius: 6 },
  submitBtn: { padding: "10px 16px", fontSize: 14, background: "#0066ff", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", alignSelf: "flex-start" },
  empty: { color: "#888", fontSize: 16 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 },
  card: { padding: 20, background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", textDecoration: "none", color: "inherit" },
  cardTitle: { fontSize: 18, marginBottom: 4 },
  cardRepo: { fontSize: 14, color: "#555", marginBottom: 8 },
  cardDate: { fontSize: 12, color: "#999" },
};

export default Dashboard;
