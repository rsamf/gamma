import type { S3Artifact } from "../types";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface Props {
  artifacts: S3Artifact[];
  onDownload: (key: string) => void;
}

function ArtifactList({ artifacts, onDownload }: Props) {
  if (artifacts.length === 0) {
    return <p style={styles.empty}>No artifacts found.</p>;
  }

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Key</th>
          <th style={styles.th}>Size</th>
          <th style={styles.th}>Last Modified</th>
          <th style={styles.th}></th>
        </tr>
      </thead>
      <tbody>
        {artifacts.map((artifact) => (
          <tr key={artifact.key} style={styles.row}>
            <td style={styles.td}>
              <code style={styles.key}>{artifact.key}</code>
            </td>
            <td style={styles.td}>{formatSize(artifact.size)}</td>
            <td style={styles.td}>
              {new Date(artifact.last_modified).toLocaleString()}
            </td>
            <td style={styles.td}>
              <button style={styles.downloadBtn} onClick={() => onDownload(artifact.key)}>
                Download
              </button>
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
  key: { fontSize: 13, wordBreak: "break-all" },
  downloadBtn: { padding: "4px 12px", fontSize: 12, background: "#0066ff", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" },
  empty: { color: "#888", fontSize: 14, padding: 16 },
};

export default ArtifactList;
