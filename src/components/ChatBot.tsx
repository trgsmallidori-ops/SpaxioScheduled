"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";

export function ChatBot() {
  const { t } = useLocale();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = message.trim();
    if (!text || loading) return;
    setMessage("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply || "No response." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Something went wrong. Try again." },
      ]);
    }
    setLoading(false);
  }

  return (
    <div className="rounded-2xl bg-white shadow-soft">
      <h2 className="border-b border-[var(--divider)] px-5 py-4 text-lg font-bold text-[var(--text)]">
        💬 {t.askAssistant}
      </h2>
      <div className="flex max-h-[400px] flex-col">
        <div className="min-h-[200px] space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="text-sm font-medium text-[var(--muted)]">{t.placeholder}</p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
                msg.role === "user"
                  ? "ml-8 bg-[var(--accent)] text-white"
                  : "mr-8 bg-[var(--border-subtle)] text-[var(--text)]"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="mr-8 rounded-xl bg-[var(--border-subtle)] px-4 py-2.5 text-sm text-[var(--muted)]">
              ...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSubmit} className="border-t border-[var(--border)] p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.placeholder}
              className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-[var(--text)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {t.send}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
