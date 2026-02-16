"use client";

interface Props {
  summary: string;
}

export function DiffViewer({ summary }: Props) {
  return (
    <div className="bg-muted p-4 rounded-lg border whitespace-pre-wrap font-mono text-sm leading-relaxed">
      <p className="m-0">{summary}</p>
    </div>
  );
}
