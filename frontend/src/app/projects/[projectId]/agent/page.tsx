"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { streamAgentChat, listConversations, getConversationMessages } from "@/lib/api";
import { ChatMessage } from "@/components/chat-message";
import type { AgentConversation, AgentMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AuthProvider } from "@/components/providers";

function AgentContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
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
    <div className="flex h-[calc(100vh-120px)] gap-0 -mx-6 -mb-6">
      <div className="w-64 border-r bg-card p-4 overflow-y-auto flex flex-col gap-2">
        <Link href={`/projects/${projectId}`} className="text-sm text-primary hover:underline mb-2">
          &larr; Project
        </Link>
        <h3 className="text-base font-semibold mb-1">Conversations</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setConversationId(undefined);
            setMessages([]);
          }}
        >
          + New Chat
        </Button>
        {conversations.map((c) => (
          <button
            key={c.id}
            className={`p-3 text-sm border rounded-md cursor-pointer text-left flex justify-between items-center ${
              c.id === conversationId ? "bg-accent" : "bg-card"
            }`}
            onClick={() => setConversationId(c.id)}
          >
            {new Date(c.created_at).toLocaleDateString()}
            {c.training_job_id && <span className="text-xs bg-accent px-2 py-0.5 rounded">job</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          {messages.map((m) => (
            <ChatMessage key={m.id} role={m.role} content={m.content} />
          ))}
          {streaming && streamText && (
            <ChatMessage role="assistant" content={streamText} />
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 p-4 border-t bg-card">
          <Input
            placeholder="Ask about your code, experiments, or metrics..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={streaming}
          />
          <Button
            onClick={handleSend}
            disabled={streaming}
            className="bg-violet-600 hover:bg-violet-700"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Agent() {
  return (
    <AuthProvider>
      <AgentContent />
    </AuthProvider>
  );
}
