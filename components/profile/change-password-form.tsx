"use client";

import { useState, type FormEvent } from "react";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (next !== confirm) {
      setErrorMsg("Die neuen Passwörter stimmen nicht überein.");
      return;
    }
    if (next.length < 8) {
      setErrorMsg("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    setStatus("loading");
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      const msg =
        data.error === "wrong_password"
          ? "Aktuelles Passwort ist falsch."
          : "Fehler beim Ändern. Bitte erneut versuchen.";
      setErrorMsg(msg);
      setStatus("error");
    } else {
      setStatus("ok");
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
      <input
        type="password"
        required
        placeholder="Aktuelles Passwort"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-[#7C3AED]"
      />
      <input
        type="password"
        required
        placeholder="Neues Passwort (min. 8 Zeichen)"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-[#7C3AED]"
      />
      <input
        type="password"
        required
        placeholder="Neues Passwort wiederholen"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-[#7C3AED]"
      />

      {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}
      {status === "ok" && (
        <p className="text-sm text-green-400">Passwort erfolgreich geändert!</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-xl bg-[#7C3AED] py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {status === "loading" ? "Wird gespeichert…" : "Passwort ändern"}
      </button>
    </form>
  );
}
