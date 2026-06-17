"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CommentDTO } from "@/app/api/comments/route";
import { HeartIcon } from "@/components/icons";

type CommentDrawerProps = {
  productId: string;
  isLoggedIn: boolean;
  onClose: () => void;
};

const MAX_LEN = 500;

// Deterministic avatar background so the same author always gets the same color.
const AVATAR_COLORS = [
  "bg-rose-500/80",
  "bg-amber-500/80",
  "bg-emerald-500/80",
  "bg-sky-500/80",
  "bg-violet-500/80",
  "bg-fuchsia-500/80",
  "bg-teal-500/80",
];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `vor ${days} ${days === 1 ? "Tag" : "Tagen"}` : new Date(iso).toLocaleDateString("de-DE");
}

export function CommentDrawer({ productId, isLoggedIn, onClose }: CommentDrawerProps) {
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    fetch(`/api/comments?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => setComments(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  function close() {
    setVisible(false);
    setTimeout(onClose, 260);
  }

  async function toggleLike(id: string) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isLikedByMe: !c.isLikedByMe, likeCount: c.likeCount + (c.isLikedByMe ? -1 : 1) } : c,
      ),
    );
    try {
      const res = await fetch(`/api/comments/${id}/like`, { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as { liked: boolean; count: number };
        setComments((prev) => prev.map((c) => (c.id === id ? { ...c, isLikedByMe: data.liked, likeCount: data.count } : c)));
      }
    } catch {
      // leave optimistic
    }
  }

  async function remove(id: string) {
    const snap = comments;
    setComments((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (!res.ok) setComments(snap);
    } catch {
      setComments(snap);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_LEN || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, content: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [data.comment as CommentDTO, ...prev]);
        setContent("");
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-[260ms] ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
        aria-hidden
      />

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[75dvh] flex-col rounded-t-3xl bg-zinc-950 shadow-2xl transition-transform duration-[260ms] ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1" onClick={close}>
          <div className="h-1.5 w-12 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 pb-3 pt-1">
          <h2 className="text-base font-bold">
            Kommentare
            {!loading && (
              <span className="ml-1.5 text-sm font-normal text-zinc-500">{comments.length}</span>
            )}
          </h2>
          <button
            type="button"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400 active:scale-90 transition-transform"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-zinc-800" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-zinc-800" />
                    <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">Noch keine Kommentare. Sei der Erste!</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {comments.map((c) => {
                const seed = c.authorUsername ?? c.authorName;
                return (
                  <li key={c.id} className="flex gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(
                        seed,
                      )}`}
                    >
                      {seed.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="relative rounded-2xl rounded-tl-sm bg-zinc-900 px-3.5 py-2.5 pr-10">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <span className="font-semibold text-zinc-200">
                            {c.authorUsername ? `@${c.authorUsername}` : c.authorName}
                          </span>
                          <span>· {timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 text-sm leading-snug text-zinc-100">{c.content}</p>

                        {/* Like button, top-right of bubble */}
                        <button
                          type="button"
                          onClick={() => toggleLike(c.id)}
                          disabled={!isLoggedIn}
                          className={`absolute right-2.5 top-2.5 flex flex-col items-center gap-0.5 active:scale-90 transition-transform disabled:opacity-40 ${
                            c.isLikedByMe ? "text-accent" : "text-zinc-500"
                          }`}
                          aria-label="Gefällt mir"
                        >
                          <HeartIcon filled={c.isLikedByMe} className="h-4 w-4" />
                          {c.likeCount > 0 && <span className="text-[10px] leading-none">{c.likeCount}</span>}
                        </button>
                      </div>
                      {c.isMine && (
                        <button
                          type="button"
                          onClick={() => remove(c.id)}
                          className="mt-1 ml-1 text-xs text-zinc-600 active:text-zinc-400"
                        >
                          Löschen
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-zinc-800/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {isLoggedIn ? (
            <form onSubmit={submit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
                rows={1}
                placeholder="Kommentar schreiben…"
                className="flex-1 resize-none rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-accent"
                style={{ maxHeight: "96px", overflowY: "auto" }}
              />
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white active:scale-90 transition-transform disabled:opacity-40"
                aria-label="Senden"
              >
                {submitting ? (
                  "…"
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                )}
              </button>
            </form>
          ) : (
            <p className="text-center text-sm text-zinc-500">
              <a href="/login" className="font-semibold text-accent">
                Anmelden
              </a>{" "}
              um zu kommentieren
            </p>
          )}
        </div>
      </div>
    </>
  );
}
