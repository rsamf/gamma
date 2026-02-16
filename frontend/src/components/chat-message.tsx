"use client";

interface Props {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex mb-3 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] px-4 py-2.5 rounded-lg text-sm leading-relaxed ${
          isUser
            ? "bg-violet-600 text-white"
            : "bg-muted text-foreground"
        }`}
      >
        <p className="m-0 whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
