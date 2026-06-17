"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function errorMessage(code: string): string {
  switch (code) {
    case "username_taken":
      return "Dieser Benutzername ist bereits vergeben.";
    case "username_invalid":
      return "Benutzername: 3-30 Zeichen, nur Buchstaben, Zahlen und _.";
    default:
      return code || "Registrierung fehlgeschlagen.";
  }
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(errorMessage(data.error));
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (!result || result.error) {
      router.push("/login");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold">Account erstellen</h1>
      <p className="mb-8 text-sm text-zinc-400">
        Kostenlos registrieren, um deine Wishlist zu speichern.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Name
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white outline-none focus:border-[#7C3AED]"
            placeholder="Dein Name"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Benutzername
          <input
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white outline-none focus:border-[#7C3AED]"
            placeholder="z. B. shopqueen"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          E-Mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white outline-none focus:border-[#7C3AED]"
            placeholder="du@beispiel.de"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Passwort
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white outline-none focus:border-[#7C3AED]"
            placeholder="Mind. 8 Zeichen"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-xl bg-[#7C3AED] py-3 text-center font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Wird erstellt..." : "Account erstellen"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Schon einen Account?{" "}
        <Link href="/login" className="font-medium text-[#7C3AED]">
          Anmelden
        </Link>
      </p>
    </div>
  );
}
