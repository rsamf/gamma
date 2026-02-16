import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProject } from "../services/api";
import { useJobs } from "../hooks/useJobs";
import JobTable from "../components/JobTable";
import type { Project as ProjectType } from "../types";

function Project() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectType | null>(null);
  const { jobs, loading: jobsLoading } = useJobs(projectId!);

  useEffect(() => {
    if (projectId) {
      getProject(projectId).then(setProject);
    }
  }, [projectId]);

  if (!project) return <p>Loading project...</p>;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <Link to="/" style={styles.backLink}>
            &larr; Projects
          </Link>
          <h2 style={styles.title}>{project.name}</h2>
          <p style={styles.repo}>{project.github_repo_full_name}</p>
        </div>
        <div style={styles.actions}>
          <Link to={`/projects/${projectId}/experiments`} style={styles.actionBtn}>
            Experiments
          </Link>
          <Link to={`/projects/${projectId}/artifacts`} style={styles.actionBtn}>
            Artifacts
          </Link>
          <Link to={`/projects/${projectId}/agent`} style={styles.agentBtn}>
            Agent Chat
          </Link>
        </div>
      </div>

      <section>
        <h3 style={styles.sectionTitle}>Training Jobs</h3>
        {jobsLoading ? (
          <p>Loading jobs...</p>
        ) : (
          <JobTable jobs={jobs} projectId={projectId!} />
        )}
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 },
  backLink: { fontSize: 14, color: "#0066ff", textDecoration: "none" },
  title: { fontSize: 28, marginTop: 4 },
  repo: { fontSize: 14, color: "#666" },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
  actionBtn: { padding: "8px 16px", fontSize: 14, background: "#fff", border: "1px solid #ddd", borderRadius: 6, textDecoration: "none", color: "#333" },
  agentBtn: { padding: "8px 16px", fontSize: 14, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, textDecoration: "none" },
  sectionTitle: { fontSize: 20, marginBottom: 12 },
};

export default Project;
