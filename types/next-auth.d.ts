import type { DefaultSession } from "next-auth";

type AppRole = "USER" | "ADMIN";

// The actual `Session`/`User`/`JWT` interfaces live in `@auth/core/*` and are
// only re-exported (type-only) from `next-auth`/`next-auth/jwt`, so the
// augmentation has to target the original modules to be picked up by the
// callback signatures used in `auth.ts` and `proxy.ts`.
declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      username?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: AppRole;
    username?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    username?: string | null;
  }
}
