import Link from "next/link";

type LegalPageProps = {
  title: string;
  children: React.ReactNode;
};

// Shared shell for all four legal/placeholder pages: back link, title and a
// visible disclaimer banner. These pages are explicitly NOT a substitute for
// real legal review - see the banner text and NOTES.md.
export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <div className="no-scrollbar h-dvh overflow-y-auto px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <Link href="/profile" className="text-sm text-zinc-400">
        ← Zurück
      </Link>
      <h1 className="mt-3 text-xl font-bold">{title}</h1>

      <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
        Platzhalter – muss vor echtem Launch juristisch geprüft werden.
      </div>

      <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-300">
        {children}
      </div>
    </div>
  );
}
