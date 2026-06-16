"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/feed" })}
      className="w-full rounded-xl border border-zinc-700 py-3 text-center font-semibold text-zinc-300"
    >
      Abmelden
    </button>
  );
}
