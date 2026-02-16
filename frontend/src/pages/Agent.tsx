import { useEffect, useState, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { streamAgentChat, listConversations, getConversationMessages } from "../services/api";
import ChatMessage from "../components/ChatMessage";
import type { AgentConversation, AgentMessage } from "../types";

function Agent() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId") ?? undefined;

  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId) {
      listConversations(projectId).then(setConversations);
    }
  }, [projectId]);

  useEffect(() => {
    if (conversationId) {
      getConversationMessages(conversationId).then(setMessages);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  const handleSend = () => {
    if (!input.trim() || !projectId || streaming) return;
    const msg = input;
    setInput("");
    setStreaming(true);
    setStreamText("");

    streamAgentChat(
      projectId,
      msg,
      conversationId,
      jobId,
      (chunk) => setStreamText((prev) => prev + chunk),
      (newConvId) => {
        setStreaming(false);
        setStreamText("");
        setConversationId(newConvId);
        getConversationMessages(newConvId).then(setMessages);
        listConversations(projectId).then(setConversations);
      }
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <Link to={`/projects/${projectId}`} style={styles.backLink}>
          &larr; Project
        </Link>
        <h3 style={styles.sidebarTitle}>Conversations</h3>
        <button
          style={styles.newBtn}
          onClick={() => {
            setConversationId(undefined);
            setMessages([]);
          }}
        >
          + New Chat
        </button>
        {conversations.map((c) => (
          <button
            key={c.id}
            style={{
              ...styles.convItem,
              background: c.id === conversationId ? "#e8e8ff" : "#fff",
            }}
            onClick={() => setConversationId(c.id)}
          >
            {new Date(c.created_at).toLocaleDateString()}
            {c.training_job_id && <span style={styles.jobTag}>job</span>}
          </button>
        ))}
      </div>

      <div style={styles.chatArea}>
        <div style={styles.messages}>
          {messages.map((m) => (
            <ChatMessage key={m.id} role={m.role} content={m.content} />
          ))}
          {streaming && streamText && (
            <ChatMessage role="assistant" content={streamText} />
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputArea}>
          <input
            style={styles.chatInput}
            placeholder="Ask about your code, experiments, or metrics..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={streaming}
          />
          <button style={styles.sendBtn} onClick={handleSend} disabled={streaming}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", height: "calc(100vh - 80px)", gap: 0 },
  sidebar: { width: 260, borderRight: "1px solid #e0e0e0", padding: 16, background: "#fff", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 },
  backLink: { fontSize: 14, color: "#0066ff", textDecoration: "none" },
  sidebarTitle: { fontSize: 16, marginTop: 8 },
  newBtn: { padding: "8px 12px", fontSize: 13, background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", textAlign: "left" as const },
  convItem: { padding: "8px 12px", fontSize: 13, border: "1px solid #eee", borderRadius: 6, cursor: "pointer", textAlign: "left" as const, display: "flex", justifyContent: "space-between", alignItems: "center" },
  jobTag: { fontSize: 10, background: "#e8e8ff", padding: "2px 6px", borderRadius: 4 },
  chatArea: { flex: 1, display: "flex", flexDirection: "column" },
  messages: { flex: 1, overflowY: "auto", padding: 24 },
  inputArea: { display: "flex", gap: 8, padding: 16, borderTop: "1px solid #e0e0e0", background: "#fff" },
  chatInput: { flex: 1, padding: "10px 14px", fontSize: 14, border: "1px solid #ddd", borderRadius: 8 },
  sendBtn: { padding: "10px 20px", fontSize: 14, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" },
};

export default Agent;
