interface Props {
  role: "user" | "assistant";
  content: string;
}

function ChatMessage({ role, content }: Props) {
  const isUser = role === "user";

  return (
    <div style={{ ...styles.wrapper, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div
        style={{
          ...styles.bubble,
          background: isUser ? "#7c3aed" : "#f0f0f0",
          color: isUser ? "#fff" : "#333",
        }}
      >
        <p style={styles.text}>{content}</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { display: "flex", marginBottom: 12 },
  bubble: { maxWidth: "70%", padding: "10px 16px", borderRadius: 12, fontSize: 14, lineHeight: 1.5 },
  text: { margin: 0, whiteSpace: "pre-wrap" },
};

export default ChatMessage;
