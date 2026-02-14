"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { eventsToIcs, downloadIcs, autoImportIcs } from "@/lib/exportToIcs";
import type { CalendarEvent } from "@/types/database";

type ExportPromptModalProps = {
  open: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  courseNames: Record<string, string>;
};

export function ExportPromptModal({
  open,
  onClose,
  events,
  courseNames,
}: ExportPromptModalProps) {
  const { t } = useLocale();

  if (!open) return null;

  const icsContent = eventsToIcs(events, courseNames);
  const eventCount = events.length;
  const dateRange =
    events.length > 0
      ? `${events[0]?.event_date ?? ""} – ${events[events.length - 1]?.event_date ?? ""}`
      : "";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-prompt-title"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-lg rounded-2xl bg-[var(--surface)] shadow-soft-lg border border-[var(--border-subtle)] max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--divider)] px-4 py-3 sm:px-6">
          <h2 id="export-prompt-title" className="text-lg font-bold text-[var(--text)]">
            {t.exportPromptTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
          <p className="text-sm text-[var(--muted)]">{t.exportPromptDesc}</p>

          {eventCount > 0 && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/50 px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text)]">
                {eventCount} {eventCount === 1 ? "event" : "events"}
                {dateRange && ` · ${dateRange}`}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                autoImportIcs(icsContent);
                onClose();
              }}
              disabled={eventCount === 0}
              className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.exportAutoImport}
            </button>
            <button
              type="button"
              onClick={() => {
                downloadIcs(icsContent);
                onClose();
              }}
              disabled={eventCount === 0}
              className="w-full rounded-xl border border-[var(--divider)] bg-[var(--surface)] px-4 py-3 text-sm font-bold text-[var(--text)] hover:bg-[var(--border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.exportDownloadToFiles}
            </button>
          </div>

          <div>
            <h3 className="text-base font-bold text-[var(--text)] mb-3">{t.howToImport}</h3>
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/50 p-4">
                <h4 className="text-sm font-semibold text-[var(--text)] mb-2">
                  {t.importGoogleTitle}
                </h4>
                <ol className="text-sm text-[var(--muted)] list-decimal list-inside space-y-1.5 whitespace-pre-line">
                  {(t.importGoogleSteps as string).split("\n").map((line, i) => (
                    <li key={i}>{line.replace(/^\d+\.\s*/, "")}</li>
                  ))}
                </ol>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/50 p-4">
                <h4 className="text-sm font-semibold text-[var(--text)] mb-2">
                  {t.importAppleTitle}
                </h4>
                <ol className="text-sm text-[var(--muted)] list-decimal list-inside space-y-1.5 whitespace-pre-line">
                  {(t.importAppleSteps as string).split("\n").map((line, i) => (
                    <li key={i}>{line.replace(/^\d+\.\s*/, "")}</li>
                  ))}
                </ol>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/50 p-4">
                <h4 className="text-sm font-semibold text-[var(--text)] mb-2">
                  {t.importOutlookTitle}
                </h4>
                <ol className="text-sm text-[var(--muted)] list-decimal list-inside space-y-1.5 whitespace-pre-line">
                  {(t.importOutlookSteps as string).split("\n").map((line, i) => (
                    <li key={i}>{line.replace(/^\d+\.\s*/, "")}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border-subtle)] transition"
          >
            {t.exportLater}
          </button>
        </div>
      </div>
    </div>
  );
}
