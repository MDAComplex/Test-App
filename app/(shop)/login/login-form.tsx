"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/feed";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result || result.error) {
      setError("E-Mail oder Passwort ist falsch.");
      return;
    }

    router.push(from);
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold">Willkommen zurueck</h1>
      <p className="mb-8 text-sm text-zinc-400">
        Melde dich an, um deine Wishlist zu sehen.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white outline-none focus:border-[#7C3AED]"
            placeholder="••••••••"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-xl bg-[#7C3AED] py-3 text-center font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Anmelden..." : "Anmelden"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Noch kein Account?{" "}
        <Link href="/register" className="font-medium text-[#7C3AED]">
          Jetzt registrieren
        </Link>
      </p>
      <Link href="/feed" className="mt-3 text-center text-sm text-zinc-500 underline">
        Ohne Login weiter zum Feed
      </Link>
    </div>
  );
}
