import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("adminToken")?.value;

    const pathname = request.nextUrl.pathname;

    // Public route
    if (pathname === "/login") {
        // Already logged in → don't show login again
        if (token) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        return NextResponse.next();
    }

    // All other routes require authentication
    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/dashboard/:path*",
        "/requests/:path*",
        "/mechanics/:path*",
        "/pricing/:path*",
        "/support/:path*",
    ],
};