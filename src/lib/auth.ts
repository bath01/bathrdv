import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionValue, isValidSessionValue, safeEqual, SESSION_COOKIE, sign } from "@/lib/session";

// Single-admin auth: the password lives in ADMIN_PASSWORD and the session is a
// signed cookie holding its expiry time. No user table needed.

const SESSION_DAYS = 7;

export function checkPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Compare HMACs so both sides have the same length.
  return safeEqual(sign(password), sign(expected));
}

export async function createSession() {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionValue(expires), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function isAdmin() {
  const store = await cookies();
  return isValidSessionValue(store.get(SESSION_COOKIE)?.value);
}

/** Call at the top of every admin page and admin server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/login");
}
