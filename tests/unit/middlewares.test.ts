import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("../../src/lib/connect", async () => {
  const helper = await import("../helpers/database");
  return {
    default: helper.databaseMock,
    DatabaseUnavailableError: helper.DatabaseUnavailableError,
  };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from "@supabase/ssr";
import {
  ApiError,
  handleApiError,
} from "../../src/middlewares/error.middleware";
import {
  authorizeCommentDeletion,
  authorizeCommentOwner,
} from "../../src/middlewares/comment-authorization.middleware";
import {
  isNonEmptyString,
  isPlainText,
  isValidDate,
  isValidUrl,
  validateRequestBody,
} from "../../src/middlewares/validation.middleware";
import { validateImageLimit } from "../../src/middlewares/media.middleware";
import { withDatabase } from "../../src/middlewares/database.middleware";
import { updateSupabaseSession } from "../../src/middlewares/supabase.middleware";
import {
  routeError,
  withAdministrator,
  withAuthenticatedUser,
} from "../../src/app/api/route.helpers";
import {
  ADMIN_ID,
  USER_ID,
  adminToken,
  apiRequest,
  readJson,
  userToken,
} from "../helpers/requests";
import {
  DatabaseUnavailableError,
  databaseMock,
} from "../helpers/database";
import { UserType } from "../../src/types/enums";

describe("error.middleware", () => {
  it("serializes an ApiError", async () => {
    const response = handleApiError(
      new ApiError("Teapot", 418, { reason: "tea" })
    );

    expect(response.status).toBe(418);
    await expect(readJson(response)).resolves.toEqual({
      error: "ApiError",
      message: "Teapot",
      details: { reason: "tea" },
    });
  });

  it("serializes unknown errors as 500", async () => {
    const response = handleApiError(new Error("unexpected"));

    expect(response.status).toBe(500);
    await expect(readJson(response)).resolves.toMatchObject({
      error: "Internal Server Error",
    });
  });

  it("handles non-Error values", async () => {
    const response = handleApiError("plain string");

    expect(response.status).toBe(500);
  });
});

describe("validation.middleware", () => {
  it("validates primitive helpers", () => {
    expect(isNonEmptyString(" value ")).toBe(true);
    expect(isNonEmptyString("   ")).toBe(false);
    expect(isNonEmptyString(1)).toBe(false);

    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate(new Date("invalid"))).toBe(false);
    expect(isValidDate("2026-11-15")).toBe(true);
    expect(isValidDate("not-a-date")).toBe(false);
    expect(isValidDate(123)).toBe(false);

    expect(isValidUrl("https://iteso.mx")).toBe(true);
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl(42)).toBe(false);

    expect(isPlainText("plain")).toBe(true);
    expect(isPlainText("<script>")).toBe(false);
    expect(isPlainText(1)).toBe(false);
  });

  it("parses a valid JSON body", async () => {
    const result = await validateRequestBody(
      apiRequest("/api/test", { method: "POST", body: { value: 1 } }),
      (body) =>
        typeof body === "object" && body !== null && "value" in body
          ? { valid: true, data: body as { value: number } }
          : { valid: false }
    );

    expect(result).toEqual({ valid: true, data: { value: 1 } });
  });

  it("rejects malformed JSON", async () => {
    const result = await validateRequestBody(
      apiRequest("/api/test", { method: "POST", rawBody: "{" }),
      () => ({ valid: true, data: null })
    );

    expect(result.valid).toBe(false);
  });

  it("rejects invalid data with errors", async () => {
    const result = await validateRequestBody(
      apiRequest("/api/test", { method: "POST", body: {} }),
      () => ({ valid: false, errors: ["value is required"] })
    );

    expect(result.valid).toBe(false);
    if (!result.valid) {
      await expect(readJson(result.response)).resolves.toMatchObject({
        error: "Validation failed",
        errors: ["value is required"],
      });
    }
  });
});

describe("media.middleware", () => {
  it("accepts undefined and valid image lists", () => {
    expect(validateImageLimit(undefined)).toBeNull();
    expect(validateImageLimit(null)).toBeNull();
    expect(validateImageLimit("https://iteso.mx/a.png")?.status).toBe(400);
    expect(
      validateImageLimit(["https://iteso.mx/a.png", "https://iteso.mx/b.png"])
    ).toBeNull();
  });

  it("rejects images over the limit", async () => {
    const response = validateImageLimit([
      "https://iteso.mx/1.png",
      "https://iteso.mx/2.png",
      "https://iteso.mx/3.png",
      "https://iteso.mx/4.png",
    ]);

    expect(response?.status).toBe(400);
    await expect(readJson(response!)).resolves.toMatchObject({
      error: "Image limit exceeded",
    });
  });

  it("rejects invalid URLs", async () => {
    const response = validateImageLimit(["not-a-url"]);

    expect(response?.status).toBe(400);
    await expect(readJson(response!)).resolves.toMatchObject({
      error: "Invalid image URL",
    });
  });
});

describe("comment-authorization.middleware", () => {
  const user = {
    id: USER_ID,
    email: "user@iteso.mx",
    name: "User",
    role: UserType.REGULAR_USER,
  };

  it("allows the owner", () => {
    expect(authorizeCommentOwner(user, USER_ID)).toBeNull();
  });

  it("rejects a different user", () => {
    const response = authorizeCommentOwner(user, ADMIN_ID);
    expect(response?.status).toBe(403);
  });

  it("only allows administrators to delete", () => {
    expect(
      authorizeCommentDeletion({
        ...user,
        role: UserType.ADMINISTRATOR,
      })
    ).toBeNull();

    expect(authorizeCommentDeletion(user)?.status).toBe(403);
  });
});

describe("database.middleware", () => {
  beforeEach(() => databaseMock.reset());

  it("runs the handler with the database", async () => {
    const handler = vi.fn(
      async (_request: NextRequest, _db: unknown) =>
        NextResponse.json({ success: true })
    );

    const response = await withDatabase(handler)(apiRequest("/api/test"));

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("returns 503 when the database is unavailable", async () => {
    databaseMock.failConnect(new DatabaseUnavailableError());

    const response = await withDatabase(
      async (_request: NextRequest, _db: unknown) =>
        NextResponse.json({ success: true })
    )(apiRequest("/api/test"));

    expect(response.status).toBe(503);
  });

  it("returns 500 for unexpected connection errors", async () => {
    databaseMock.failConnect(new Error("offline"));

    const response = await withDatabase(
      async (_request: NextRequest, _db: unknown) =>
        NextResponse.json({ success: true })
    )(apiRequest("/api/test"));

    expect(response.status).toBe(500);
  });

  it("returns 500 when the handler throws", async () => {
    const response = await withDatabase(
      async (_request: NextRequest, _db: unknown) => {
        throw new Error("handler failed");
      }
    )(apiRequest("/api/test"));

    expect(response.status).toBe(500);
  });
});

describe("route.helpers", () => {
  const handler = vi.fn(
    async (_request: NextRequest, _db: unknown) =>
      NextResponse.json({ success: true })
  );

  beforeEach(() => {
    handler.mockClear();
    databaseMock.reset();
  });

  const db = databaseMock as never;

  it("requires an authenticated user", async () => {
    expect(
      (await withAuthenticatedUser(handler)(apiRequest("/api/test"), db))
        .status
    ).toBe(401);

    const response = await withAuthenticatedUser(handler)(
      apiRequest("/api/test", { token: userToken() }),
      db
    );
    expect(response.status).toBe(200);
  });

  it("requires an administrator", async () => {
    expect(
      (
        await withAdministrator(handler)(
          apiRequest("/api/test", { token: userToken() }),
          db
        )
      ).status
    ).toBe(403);

    const response = await withAdministrator(handler)(
      apiRequest("/api/test", { token: adminToken() }),
      db
    );
    expect(response.status).toBe(200);
  });

  it("wraps errors through routeError", async () => {
    const response = routeError(new ApiError("Bad", 400));

    expect(response.status).toBe(400);
  });
});

describe("supabase.middleware", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  beforeEach(() => {
    vi.mocked(createServerClient).mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  });

  it("returns a response without a client when env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const response = await updateSupabaseSession(
      new NextRequest("http://localhost:3000/")
    );

    expect(response).toBeInstanceOf(NextResponse);
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("refreshes the session and forwards cookies", async () => {
    const getUser = vi.fn(async () => ({ data: { user: null }, error: null }));

    vi.mocked(createServerClient).mockImplementation((_url, _key, options) => {
      const cookieAdapter = (
        options as {
          cookies: {
            getAll: () => unknown;
            setAll: (values: unknown[]) => void;
          };
        }
      ).cookies;

      cookieAdapter.getAll();
      cookieAdapter.setAll([
        { name: "session", value: "abc", options: { path: "/" } },
      ]);

      return {
        auth: { getUser },
      } as unknown as ReturnType<typeof createServerClient>;
    });

    const response = await updateSupabaseSession(
      new NextRequest("http://localhost:3000/")
    );

    expect(createServerClient).toHaveBeenCalledOnce();
    expect(getUser).toHaveBeenCalledOnce();
    expect(response.cookies.get("session")?.value).toBe("abc");
  });
});
