// Cookie that identifies an anonymous visitor across requests. Set by `proxy.ts`
// for every visitor (logged in or not) so anonymous events/affiliate clicks can
// still be attributed to a session without requiring an account.
export const SESSION_COOKIE_NAME = "ww_sid";
