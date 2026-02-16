import { Link } from "react-router-dom";
import type { TrainingJob } from "../types";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  running: "#3b82f6",
  completed: "#10b981",
  failed: "#ef4444",
};

interface Props {
  jobs: TrainingJob[];
  projectId: string;
}

function JobTable({ jobs, projectId }: Props) {
  if (jobs.length === 0) {
    return <p style={styles.empty}>No training jobs yet. Push to a models branch to trigger one.</p>;
  }

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Commit</th>
          <th style={styles.th}>Branch</th>
          <th style={styles.th}>Status</th>
          <th style={styles.th}>Created</th>
          <th style={styles.th}></th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr key={job.id} style={styles.row}>
            <td style={styles.td}>
              <code>{job.commit_sha.slice(0, 8)}</code>
            </td>
            <td style={styles.td}>{job.branch}</td>
            <td style={styles.td}>
              <span
                style={{
                  ...styles.badge,
                  background: STATUS_COLORS[job.status] ?? "#888",
                }}
              >
                {job.status}
              </span>
            </td>
            <td style={styles.td}>{new Date(job.created_at).toLocaleString()}</td>
            <td style={styles.td}>
              <Link to={`/projects/${projectId}/jobs/${job.id}`} style={styles.link}>
                View
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const styles: Record<string, React.CSSProperties> = {
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid #e0e0e0" },
  th: { textAlign: "left", padding: "10px 16px", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #e0e0e0", background: "#fafafa" },
  row: { borderBottom: "1px solid #f0f0f0" },
  td: { padding: "10px 16px", fontSize: 14 },
  badge: { padding: "3px 10px", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 600 },
  link: { color: "#0066ff", textDecoration: "none", fontSize: 13 },
  empty: { color: "#888", fontSize: 14, padding: 16 },
};

export default JobTable;
