import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listArtifacts, getDownloadUrl } from "../services/api";
import ArtifactList from "../components/ArtifactList";
import type { S3Artifact } from "../types";

function Artifacts() {
  const { projectId } = useParams<{ projectId: string }>();
  const [artifacts, setArtifacts] = useState<S3Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefix, setPrefix] = useState("");

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      listArtifacts(projectId, prefix)
        .then(setArtifacts)
        .finally(() => setLoading(false));
    }
  }, [projectId, prefix]);

  const handleDownload = async (key: string) => {
    if (!projectId) return;
    const { url } = await getDownloadUrl(projectId, key);
    window.open(url, "_blank");
  };

  return (
    <div>
      <Link to={`/projects/${projectId}`} style={styles.backLink}>
        &larr; Back to project
      </Link>
      <h2 style={styles.title}>Artifacts & Checkpoints</h2>

      <div style={styles.controls}>
        <input
          style={styles.input}
          placeholder="Filter by prefix..."
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading artifacts...</p>
      ) : (
        <ArtifactList artifacts={artifacts} onDownload={handleDownload} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backLink: { fontSize: 14, color: "#0066ff", textDecoration: "none" },
  title: { fontSize: 24, margin: "12px 0 20px" },
  controls: { marginBottom: 16 },
  input: { padding: "8px 12px", fontSize: 14, border: "1px solid #ddd", borderRadius: 6, width: 300 },
};

export default Artifacts;
