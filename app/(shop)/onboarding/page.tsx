"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const CATEGORIES = ["Tech", "Fashion", "Beauty", "Gaming", "Home", "Gadgets", "Sport", "Viral"];
const BUDGETS = ["Unter 50 €", "50–200 €", "200–1000 €", "Egal"];
const VIBES = ["Deals", "Luxus", "Viral", "Praktisch", "Ästhetisch"];

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition active:scale-[0.97] ${
        active
          ? "border-[#7C3AED] bg-[#7C3AED] text-white"
          : "border-zinc-700 bg-zinc-900 text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { status } = useSession();

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>("");
  const [vibes, setVibes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?from=/onboarding");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10 text-sm text-zinc-400">
        Lädt…
      </div>
    );
  }

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const canContinue =
    (step === 0 && categories.length >= 1) ||
    (step === 1 && budget !== "") ||
    step === 2;

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories, budget, vibes }),
      });
      if (!res.ok) {
        setError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
        setSaving(false);
        return;
      }
      router.push("/feed");
      router.refresh();
    } catch {
      setError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      {/* Progress */}
      <div className="mb-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#7C3AED]" : "bg-zinc-800"}`}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col">
        {step === 0 && (
          <>
            <h1 className="mb-1 text-2xl font-bold">Welche Kategorien interessieren dich?</h1>
            <p className="mb-6 text-sm text-zinc-400">Wähle mindestens eine aus.</p>
            <div className="flex flex-wrap gap-2.5">
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active={categories.includes(c)}
                  onClick={() => toggle(categories, c, setCategories)}
                />
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="mb-1 text-2xl font-bold">Was ist dein Budget-Vibe?</h1>
            <p className="mb-6 text-sm text-zinc-400">Wähle eine Option.</p>
            <div className="flex flex-col gap-2.5">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudget(b)}
                  aria-pressed={budget === b}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition active:scale-[0.99] ${
                    budget === b
                      ? "border-[#7C3AED] bg-[#7C3AED] text-white"
                      : "border-zinc-700 bg-zinc-900 text-zinc-300"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="mb-1 text-2xl font-bold">Was willst du eher sehen?</h1>
            <p className="mb-6 text-sm text-zinc-400">Wähle, was zu dir passt.</p>
            <div className="flex flex-wrap gap-2.5">
              {VIBES.map((v) => (
                <Chip
                  key={v}
                  label={v}
                  active={vibes.includes(v)}
                  onClick={() => toggle(vibes, v, setVibes)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={saving}
            className="flex-1 rounded-xl border border-zinc-700 py-3 text-center font-semibold text-zinc-300 transition active:scale-[0.98] disabled:opacity-60"
          >
            Zurück
          </button>
        )}
        {step < 2 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue}
            className="flex-1 rounded-xl bg-[#7C3AED] py-3 text-center font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          >
            Weiter
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={saving}
            className="flex-1 rounded-xl bg-[#7C3AED] py-3 text-center font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "Speichern…" : "Fertig"}
          </button>
        )}
      </div>
    </div>
  );
}
