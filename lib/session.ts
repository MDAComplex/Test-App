import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

// `proxy.ts` guarantees this cookie exists for every request that goes through
// it. The random fallback only protects against the (unexpected) case where a
// request reaches server code without having passed through Proxy.
export async function getSessionId(): Promise<string> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? crypto.randomUUID();
}
