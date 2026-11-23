import { NextRequest, NextResponse } from "next/server";
import {
  authenticateRequest,
  requireAdministrator,
  AuthenticatedUser,
} from "../../middlewares/auth.middleware";
import { ApiError, handleApiError } from "../../middlewares/error.middleware";
import { SupabaseClient } from "@supabase/supabase-js";

type DatabaseRoute = (
  request: NextRequest,
  db: SupabaseClient
) => Promise<NextResponse>;

type AuthenticatedDatabaseRoute = (
  request: NextRequest,
  db: SupabaseClient,
  user: AuthenticatedUser
) => Promise<NextResponse>;

export function withAuthenticatedUser(
  handler: AuthenticatedDatabaseRoute
): DatabaseRoute {
  return async (request, db) => {
    const result = authenticateRequest(request);

    if (!result.authenticated) {
      return result.response;
    }

    return handler(request, db, result.user);
  };
}

export function withAdministrator(
  handler: DatabaseRoute
): DatabaseRoute {
  return async (request, db) => {
    const result = requireAdministrator(request);

    if (!result.authenticated) {
      return result.response;
    }

    return handler(request, db);
  };
}

export function routeError(error: unknown): NextResponse {
  return handleApiError(
    error instanceof Error
      ? error
      : new ApiError("Unexpected route error.")
  );
}
