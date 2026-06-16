import Link from "next/link";

export default function Home() {
  return (
    <div className="flex h-dvh flex-1 flex-col items-center justify-center gap-6 bg-black px-8 text-center text-white">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Wishlist <span className="text-accent">Wars</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Entdecke Produkte im Feed. Doppeltippen, wishlisten, im Shop weiterklicken.
        </p>
      </div>
      <Link
        href="/feed"
        className="w-full max-w-xs rounded-xl bg-accent py-3.5 text-center font-semibold text-white transition active:scale-[0.98]"
      >
        Feed starten
      </Link>
      <Link href="/login" className="text-sm text-zinc-500 underline">
        Anmelden
      </Link>
    </div>
  );
}
