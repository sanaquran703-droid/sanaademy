import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "sana_session";

const PUBLIC_PATHS = ["/", "/login", "/login/admin", "/login/teacher", "/login/student", "/forgot-password", "/about", "/programs", "/faq", "/contact"];
// API routes enforce their own authentication and return JSON errors. Skipping
// them in the middleware avoids redirecting API clients to an HTML login page.
const PUBLIC_PREFIXES = ["/api", "/_next", "/images", "/favicon"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

const DASHBOARD_BY_ROLE: Record<string, string> = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    // Unauthenticated users go to the portal chooser. Do NOT use callbackUrl
    // to determine who may log in — that is the server's job at POST /api/auth/login.
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) return NextResponse.redirect(new URL("/login", req.nextUrl.origin));

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const role = payload.role as string;
    const mustChange = Boolean(payload.mustChangePassword);

    if (mustChange && pathname !== "/change-password" && !pathname.startsWith("/api/auth")) {
      return NextResponse.redirect(new URL("/change-password", req.nextUrl.origin));
    }

    // Portal login pages: if already authenticated with a different role,
    // send them straight to their own dashboard (no re-login through another portal).
    const portalMatch = pathname.match(/^\/login\/(student|teacher|admin)$/);
    if (portalMatch && portalMatch[1] !== role) {
      return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE[role] ?? "/login", req.nextUrl.origin));
    }

    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE[role] ?? "/login", req.nextUrl.origin));
    }
    if (pathname.startsWith("/teacher") && role !== "teacher") {
      return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE[role] ?? "/login", req.nextUrl.origin));
    }
    if (pathname.startsWith("/student") && role !== "student") {
      return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE[role] ?? "/login", req.nextUrl.origin));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
