"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";

const FAB_SIZE = 56;
const PANEL_WIDTH = 380;
const PANEL_MAX_HEIGHT = 420;

export function ChatBot() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
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
        { role: "assistant", content: data.reply || data.error || "No response." },
      ]);
      if (data.calendarUpdated) {
        window.dispatchEvent(new CustomEvent("spaxio:calendar-updated"));
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Something went wrong. Try again." },
      ]);
    }
    setLoading(false);
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-0"
      style={{ margin: 0 }}
    >
      {/* Expandable panel */}
      <div
        className="overflow-hidden rounded-2xl bg-[var(--surface)] shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out border border-[var(--border)]"
        style={{
          width: open ? PANEL_WIDTH : 0,
          height: open ? PANEL_MAX_HEIGHT : 0,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div className="flex h-full w-[380px] flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--divider)] px-4 py-3">
            <h2 className="text-base font-bold text-[var(--text)]">
              💬 {t.askAssistant}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-[var(--muted)] transition hover:bg-[var(--border-subtle)] hover:text-[var(--text)]"
              aria-label="Minimize chat"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-[160px] flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--muted)]">
                    {t.placeholder}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {t.chatHint}
                  </p>
                </div>
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
            <form
              onSubmit={handleSubmit}
              className="shrink-0 border-t border-[var(--border)] p-4"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.placeholder}
                  className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {t.send}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Floating circle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg transition hover:bg-[var(--accent-hover)] hover:scale-105 hover:[animation-play-state:paused] active:scale-95 ring-4 ring-[var(--accent)]/30 ${
          !open ? "animate-chat-fab-bounce" : ""
        }`}
        style={{
          width: FAB_SIZE,
          height: FAB_SIZE,
          boxShadow: "0 4px 20px rgba(66, 85, 255, 0.4), 0 8px 24px rgba(0,0,0,0.15)",
        }}
        aria-label={open ? "Minimize chat" : "Open chat"}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <span className="text-2xl" aria-hidden>💬</span>
        )}
      </button>
    </div>
  );
}
