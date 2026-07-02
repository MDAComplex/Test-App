"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ProductDTO } from "@/lib/types";
import { HeartIcon, SearchIcon } from "@/components/icons";

type DiscoverClientProps = {
  initialItems: ProductDTO[];
  categories: string[];
};

const currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const DEBOUNCE_MS = 300;

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function ProductGridCard({ product }: { product: ProductDTO }) {
  return (
    <Link href={`/product/${product.id}`} className="flex flex-col overflow-hidden rounded-2xl bg-zinc-900">
      <div className="relative aspect-[3/4] w-full bg-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.posterUrl ?? product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        {product.deliveryTime && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-medium text-white">
            🚚 {product.deliveryTime}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="text-[11px] text-zinc-400">{product.shopName}</p>
        <p className="line-clamp-2 text-sm font-semibold leading-tight">{product.name}</p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <p className="text-sm font-bold text-accent">{currency.format(product.price)}</p>
          <span className="flex items-center gap-1 text-[11px] text-zinc-400">
            <HeartIcon filled className="h-3.5 w-3.5 text-rose-400" />
            {formatCount(product.likeCount)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function DiscoverClient({ initialItems, categories }: DiscoverClientProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  // Cached search results plus the query/category they belong to, so we can
  // tell whether the current input has been resolved yet (= loading state)
  // without calling setState synchronously inside the effect.
  const [searchResults, setSearchResults] = useState<ProductDTO[]>([]);
  const [resultsKey, setResultsKey] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const isDefault = trimmedQuery.length === 0 && !category;
  const currentKey = `${trimmedQuery}|${category ?? ""}`;

  useEffect(() => {
    // No query and no category filter -> the server-provided trending set is
    // shown directly (see `displayed` below); nothing to fetch.
    if (isDefault) return;

    const handle = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (trimmedQuery) params.set("q", trimmedQuery);
        if (category) params.set("category", category);
        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setSearchResults(data.items ?? []);
        setResultsKey(`${trimmedQuery}|${category ?? ""}`);
      } catch {
        // Keep whatever is on screen; a failed search shouldn't blank the page.
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [trimmedQuery, category, isDefault]);

  const loading = !isDefault && resultsKey !== currentKey;
  const items = isDefault ? initialItems : resultsKey === currentKey ? searchResults : [];

  const heading = useMemo(() => {
    if (trimmedQuery) return `Ergebnisse für „${trimmedQuery}“`;
    if (category) return category;
    return "Trending";
  }, [trimmedQuery, category]);

  return (
    <div className="no-scrollbar h-dvh overflow-y-auto px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
      <h1 className="text-xl font-bold">Entdecken</h1>

      {/* Search input */}
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2.5 ring-1 ring-zinc-800 focus-within:ring-accent">
        <SearchIcon className="h-5 w-5 shrink-0 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Produkte, Marken, Tags …"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          autoComplete="off"
        />
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              !category ? "bg-accent text-white" : "bg-zinc-800 text-zinc-300"
            }`}
          >
            Alle
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory((prev) => (prev === cat ? null : cat))}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                category === cat ? "bg-accent text-white" : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <h2 className="mt-5 text-sm font-bold text-zinc-300">{heading}</h2>

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Suche läuft …</p>
      ) : items.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-400">
          Nichts gefunden für „{trimmedQuery || category}“.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {items.map((product) => (
            <ProductGridCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
