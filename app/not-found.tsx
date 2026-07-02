import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh justify-center bg-black">
      <div className="relative flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center bg-black px-6 text-center text-white sm:shadow-[0_0_60px_rgba(124,58,237,0.15)]">
        <p className="text-6xl font-black text-accent">404</p>
        <h1 className="mt-4 text-xl font-bold">Diese Seite gibt es nicht</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Das Produkt oder die Seite wurde entfernt oder ist nicht mehr verfügbar.
        </p>
        <Link
          href="/feed"
          className="mt-8 rounded-xl bg-accent px-6 py-3 font-semibold text-white active:scale-[0.98] transition-transform"
        >
          Zum Feed
        </Link>
      </div>
    </div>
  );
}
