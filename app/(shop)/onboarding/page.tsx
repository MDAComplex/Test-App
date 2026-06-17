"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const CATEGORIES = [
  { label: "Tech", emoji: "💻" },
  { label: "Fashion", emoji: "👗" },
  { label: "Beauty", emoji: "💄" },
  { label: "Gaming", emoji: "🎮" },
  { label: "Home", emoji: "🏠" },
  { label: "Gadgets", emoji: "⚡" },
  { label: "Sport", emoji: "🏋️" },
  { label: "Viral", emoji: "🔥" },
  { label: "Musik", emoji: "🎵" },
  { label: "Reisen", emoji: "✈️" },
  { label: "Food", emoji: "🍕" },
  { label: "Pets", emoji: "🐾" },
];

const BUDGETS = [
  { label: "Unter 25 €", emoji: "💸", desc: "Schnäppchen & Deals" },
  { label: "25–100 €", emoji: "🛍️", desc: "Alltagsbudget" },
  { label: "100–500 €", emoji: "✨", desc: "Premium Picks" },
  { label: "500–2000 €", emoji: "💎", desc: "Luxury Items" },
  { label: "Keine Grenze", emoji: "🤑", desc: "Zeig mir alles" },
];

const VIBES = [
  { label: "Deals", emoji: "🏷️" },
  { label: "Luxus", emoji: "👑" },
  { label: "Viral", emoji: "📱" },
  { label: "Praktisch", emoji: "🔧" },
  { label: "Ästhetisch", emoji: "🎨" },
  { label: "Minimal", emoji: "🤍" },
  { label: "Streetwear", emoji: "🧢" },
  { label: "Premium", emoji: "💍" },
  { label: "Eco", emoji: "🌿" },
  { label: "Techie", emoji: "🤓" },
];

const STEPS = [
  { title: "Was interessiert dich?", sub: "Wähle mindestens eine Kategorie." },
  { title: "Dein Budget-Vibe?", sub: "Wir passen den Feed für dich an." },
  { title: "Dein Style?", sub: "Wähle was dir entspricht." },
];

function EmojiChip({
  label,
  emoji,
  active,
  onClick,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-150 active:scale-95 ${
        active
          ? "border-[#7C3AED] bg-[#7C3AED] text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]"
          : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { status } = useSession();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"forward" | "back">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [vibes, setVibes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?from=/onboarding");
  }, [status, router]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-[#7C3AED]" />
      </div>
    );
  }

  function goTo(next: number) {
    setDir(next > step ? "forward" : "back");
    setAnimKey((k) => k + 1);
    setStep(next);
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
      setDone(true);
      redirectTimerRef.current = setTimeout(() => {
        router.push("/feed");
        router.refresh();
      }, 1800);
    } catch {
      setError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
      setSaving(false);
    }
  }

  const animClass = dir === "forward" ? "animate-slide-in-right" : "animate-slide-in-left";

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden px-6 py-8">

      {/* Finish overlay */}
      {done && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <div className="animate-fade-scale-in flex flex-col items-center gap-5">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#7C3AED]/20 ring-4 ring-[#7C3AED]/40">
              <svg viewBox="0 0 36 36" fill="none" className="h-12 w-12">
                <polyline
                  points="6,18 14,26 30,10"
                  stroke="#7C3AED"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-check-stroke"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">Alles klar! 🚀</p>
              <p className="mt-1 text-sm text-zinc-400">Dein Feed wird personalisiert…</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-8 flex gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="relative h-1 flex-1 overflow-hidden rounded-full bg-zinc-800"
          >
            <div
              className={`absolute inset-y-0 left-0 rounded-full bg-[#7C3AED] transition-all duration-500 ease-out ${
                i < step ? "w-full" : i === step ? "w-full" : "w-0"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Step header */}
      <div key={`header-${animKey}`} className={animClass}>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#7C3AED]">
          Schritt {step + 1} / {STEPS.length}
        </p>
        <h1 className="mt-1 text-2xl font-bold leading-tight">{STEPS[step].title}</h1>
        <p className="mt-1 text-sm text-zinc-400">{STEPS[step].sub}</p>
      </div>

      {/* Step content */}
      <div key={`content-${animKey}`} className={`mt-6 flex-1 overflow-y-auto ${animClass}`}>
        {step === 0 && (
          <div className="flex flex-wrap gap-2.5 pb-4">
            {CATEGORIES.map(({ label, emoji }) => (
              <EmojiChip
                key={label}
                label={label}
                emoji={emoji}
                active={categories.includes(label)}
                onClick={() => toggle(categories, label, setCategories)}
              />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-2.5 pb-4">
            {BUDGETS.map(({ label, emoji, desc }) => (
              <button
                key={label}
                type="button"
                onClick={() => setBudget(label)}
                aria-pressed={budget === label}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-150 active:scale-[0.98] ${
                  budget === label
                    ? "border-[#7C3AED] bg-[#7C3AED]/10 shadow-[0_0_16px_rgba(124,58,237,0.25)]"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <div>
                  <p className={`text-sm font-semibold ${budget === label ? "text-white" : "text-zinc-200"}`}>{label}</p>
                  <p className="text-xs text-zinc-500">{desc}</p>
                </div>
                {budget === label && (
                  <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#7C3AED]">
                    <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                      <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-wrap gap-2.5 pb-4">
            {VIBES.map(({ label, emoji }) => (
              <EmojiChip
                key={label}
                label={label}
                emoji={emoji}
                active={vibes.includes(label)}
                onClick={() => toggle(vibes, label, setVibes)}
              />
            ))}
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {/* Navigation */}
      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            disabled={saving}
            className="flex h-13 w-13 items-center justify-center rounded-2xl border border-zinc-700 text-zinc-300 transition active:scale-95 disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => goTo(step + 1)}
            disabled={!canContinue}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          >
            Weiter
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Speichern…
              </>
            ) : (
              <>
                Feed starten 🚀
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
