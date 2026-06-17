"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CommentDTO } from "@/app/api/comments/route";

type CommentDrawerProps = {
  productId: string;
  isLoggedIn: boolean;
  onClose: () => void;
};

const MAX_LEN = 500;

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
    // animate in
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
        className="fixed inset-0 z-40 bg-black/50"
        onClick={close}
        aria-hidden
      />

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[72dvh] flex-col rounded-t-2xl bg-zinc-950 transition-transform duration-[260ms] ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-700" />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-sm font-semibold">
            Kommentare {!loading && comments.length > 0 && <span className="text-zinc-500">({comments.length})</span>}
          </h2>
          <button type="button" onClick={close} className="text-zinc-400 text-sm">
            ✕
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {loading ? (
            <p className="py-6 text-center text-sm text-zinc-500">Lädt…</p>
          ) : comments.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">Noch keine Kommentare. Sei der Erste!</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                    {(c.authorUsername ?? c.authorName).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <span className="font-semibold text-zinc-200">
                        {c.authorUsername ? `@${c.authorUsername}` : c.authorName}
                      </span>
                      <span>· {timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-100">{c.content}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => toggleLike(c.id)}
                        disabled={!isLoggedIn}
                        className={`flex items-center gap-1 ${c.isLikedByMe ? "text-accent" : "text-zinc-500"} disabled:opacity-40`}
                      >
                        ♥ {c.likeCount > 0 && c.likeCount}
                      </button>
                      {c.isMine && (
                        <button type="button" onClick={() => remove(c.id)} className="text-zinc-600">
                          Löschen
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-zinc-800 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {isLoggedIn ? (
            <form onSubmit={submit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
                rows={1}
                placeholder="Kommentar schreiben…"
                className="flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-[#7C3AED]"
                style={{ maxHeight: "96px", overflowY: "auto" }}
              />
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="shrink-0 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                {submitting ? "…" : "Senden"}
              </button>
            </form>
          ) : (
            <p className="text-center text-sm text-zinc-500">
              <a href="/login" className="font-semibold text-[#7C3AED]">Anmelden</a> um zu kommentieren
            </p>
          )}
        </div>
      </div>
    </>
  );
}
