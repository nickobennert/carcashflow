import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"
import type { Profile } from "@/types"

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/messages",
  "/profile",
  "/settings",
  "/pricing",
  "/changelog",
]

// Routes that require active subscription (not frozen)
const subscriptionRequiredRoutes = ["/dashboard", "/messages"]

// Routes only accessible when NOT authenticated
const authRoutes = ["/login", "/signup"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user, supabase } = await updateSession(request)

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Check if route is auth route (login/signup)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Check if route requires subscription
  const requiresSubscription = subscriptionRequiredRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // For protected routes, check if profile exists and is complete
  if (isProtectedRoute && user) {
    // Type assertion for profile query since table might not exist yet
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("username, first_name, subscription_status, trial_ends_at")
      .eq("id", user.id)
      .single() as {
        data: Pick<Profile, "username" | "first_name" | "subscription_status" | "trial_ends_at"> | null
        error: { code?: string } | null
      }

    // If table doesn't exist or no profile, redirect to profile setup
    if ((error || !profile) && !pathname.startsWith("/profile/setup")) {
      return NextResponse.redirect(new URL("/profile/setup", request.url))
    }

    // If profile is incomplete (no first_name), redirect to setup
    if (profile && !profile.first_name && !pathname.startsWith("/profile/setup")) {
      return NextResponse.redirect(new URL("/profile/setup", request.url))
    }

    // Check subscription status for routes that require it
    if (requiresSubscription && profile) {
      const isFrozen = profile.subscription_status === "frozen"
      const trialExpired =
        profile.subscription_status === "trialing" &&
        profile.trial_ends_at &&
        new Date(profile.trial_ends_at) < new Date()

      if ((isFrozen || trialExpired) && !pathname.startsWith("/pricing")) {
        // Allow access to settings and pricing even when frozen
        if (!pathname.startsWith("/settings")) {
          return NextResponse.redirect(new URL("/pricing", request.url))
        }
      }
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
