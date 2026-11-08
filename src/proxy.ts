import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionValue, SESSION_COOKIE } from "@/lib/session";

// Sends visitors without a valid session straight to /login (HTTP 307) before any
// admin page renders. Pages and server actions still check the session themselves.
export function proxy(request: NextRequest) {
  if (!isValidSessionValue(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
