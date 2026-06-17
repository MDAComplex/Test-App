"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { CommentDTO } from "@/app/api/comments/route";
import { HeartIcon } from "@/components/icons";

type CommentsSectionProps = {
  productId: string;
  initialComments: CommentDTO[];
  isLoggedIn: boolean;
};

const MAX_LEN = 500;

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `vor ${days} ${days === 1 ? "Tag" : "Tagen"}`;
  return new Date(iso).toLocaleDateString("de-DE");
}

export function CommentsSection({ productId, initialComments, isLoggedIn }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentDTO[]>(initialComments);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_LEN) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, content: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("Kommentar konnte nicht gespeichert werden.");
        setSubmitting(false);
        return;
      }
      setComments((prev) => [data.comment as CommentDTO, ...prev]);
      setContent("");
    } catch {
      setError("Kommentar konnte nicht gespeichert werden.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLike(id: string) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, isLikedByMe: !c.isLikedByMe, likeCount: c.likeCount + (c.isLikedByMe ? -1 : 1) }
          : c,
      ),
    );
    try {
      const res = await fetch(`/api/comments/${id}/like`, { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as { liked: boolean; count: number };
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isLikedByMe: data.liked, likeCount: data.count } : c)),
        );
      }
    } catch {
      // Optimistic; leave UI as-is on transient failure.
    }
  }

  async function remove(id: string) {
    const snapshot = comments;
    setComments((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (!res.ok) setComments(snapshot);
    } catch {
      setComments(snapshot);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-base font-bold">
        Kommentare {comments.length > 0 && <span className="text-zinc-500">({comments.length})</span>}
      </h2>

      {isLoggedIn ? (
        <form onSubmit={submit} className="mt-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
            maxLength={MAX_LEN}
            rows={3}
            placeholder="Schreib einen Kommentar…"
            className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]"
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              {content.length}/{MAX_LEN}
            </span>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
            >
              {submitting ? "Sendet…" : "Kommentieren"}
            </button>
          </div>
          {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        </form>
      ) : (
        <p className="mt-3 rounded-xl bg-zinc-900 px-3 py-3 text-sm text-zinc-400">
          <Link href="/login" className="font-semibold text-[#7C3AED]">
            Anmelden
          </Link>{" "}
          um zu kommentieren
        </p>
      )}

      <ul className="mt-5 flex flex-col gap-4">
        {comments.length === 0 && (
          <li className="text-sm text-zinc-500">Noch keine Kommentare. Sei der Erste!</li>
        )}
        {comments.map((c) => (
          <li key={c.id} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-200">
                {c.authorUsername ? `@${c.authorUsername}` : c.authorName}
              </span>
              <span>· {timeAgo(c.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-zinc-100">{c.content}</p>
            <div className="flex items-center gap-4 text-xs">
              <button
                type="button"
                onClick={() => toggleLike(c.id)}
                disabled={!isLoggedIn}
                className={`flex items-center gap-1 ${c.isLikedByMe ? "text-accent" : "text-zinc-500"} disabled:opacity-50`}
                aria-label="Gefällt mir"
              >
                <HeartIcon filled={c.isLikedByMe} className="h-4 w-4" />
                <span>{c.likeCount}</span>
              </button>
              {c.isMine && (
                <button type="button" onClick={() => remove(c.id)} className="text-zinc-500">
                  Löschen
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
