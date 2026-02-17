import { createHmac, timingSafeEqual } from "crypto";

const AUTH_SECRET = process.env.AUTH_SECRET || "";
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "";
const SESSION_PAYLOAD = "dashboard-session-v1";

export const SESSION_COOKIE_NAME = "dashboard_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function generateSessionToken(): string {
  return createHmac("sha256", AUTH_SECRET)
    .update(SESSION_PAYLOAD)
    .digest("hex");
}

export function verifySessionToken(token: string): boolean {
  const expected = generateSessionToken();
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function verifyPassword(input: string): boolean {
  if (!DASHBOARD_PASSWORD) return false;
  if (input.length !== DASHBOARD_PASSWORD.length) return false;
  return timingSafeEqual(
    Buffer.from(input),
    Buffer.from(DASHBOARD_PASSWORD)
  );
}
