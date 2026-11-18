import { NextRequest, NextResponse } from "next/server";
import { updateSupabaseSession } from "./middlewares/supabase.middleware";

/*
  Official Next.js proxy entry point (formerly "middleware").
  - SRP: this file only coordinates the global proxy.
 */

export async function proxy(
  request: NextRequest
): Promise<NextResponse> {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
