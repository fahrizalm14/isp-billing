import { verify } from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname == "/" || pathname.includes("/home")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  console.log("⛳ pathname:", pathname);

  if (
    PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(path)
    ) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  } else {
    if (pathname.includes("/login")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-role", decoded.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|login|register).*)"],
};
