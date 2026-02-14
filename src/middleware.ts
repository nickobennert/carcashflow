import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/messages",
  "/profile",
  "/settings",
  "/changelog",
]

// Routes only accessible when NOT authenticated
const authRoutes = ["/login", "/signup", "/forgot-password"]

// Routes that skip the redirect-to-dashboard check (password reset needs auth session)
const skipAuthRedirect = ["/reset-password"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user, supabase } = await updateSession(request)

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Check if route is auth route (login/signup)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Check if route should skip auth redirect (reset-password)
  const isSkipAuthRedirect = skipAuthRedirect.some((route) => pathname.startsWith(route))

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users from auth routes to dashboard
  // (but not for reset-password which needs the recovery session)
  if (isAuthRoute && user && !isSkipAuthRedirect) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // For protected routes, check if profile exists and is complete
  if (isProtectedRoute && user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("username, first_name")
      .eq("id", user.id)
      .single()

    const profile = data as { username: string; first_name: string | null } | null

    // If no profile, redirect to profile setup
    if ((error || !profile) && !pathname.startsWith("/profile/setup")) {
      return NextResponse.redirect(new URL("/profile/setup", request.url))
    }

    // If profile is incomplete (no first_name), redirect to setup
    if (profile && !profile.first_name && !pathname.startsWith("/profile/setup")) {
      return NextResponse.redirect(new URL("/profile/setup", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
