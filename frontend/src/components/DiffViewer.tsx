interface Props {
  summary: string;
}

function DiffViewer({ summary }: Props) {
  return (
    <div style={styles.container}>
      <p style={styles.text}>{summary}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    border: "1px solid #e0e0e0",
    whiteSpace: "pre-wrap",
    fontFamily: "monospace",
    fontSize: 14,
    lineHeight: 1.6,
  },
  text: { margin: 0 },
};

export default DiffViewer;
