import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/connect", async () => {
  const helper = await import("../helpers/database");
  return {
    default: helper.databaseMock,
    DatabaseUnavailableError: helper.DatabaseUnavailableError,
  };
});

import { GET } from "../../src/app/api/auth/route";
import { POST as login } from "../../src/app/api/auth/login/route";
import { POST as register } from "../../src/app/api/auth/register/route";
import { UserType } from "../../src/types/enums";
import { databaseMock } from "../helpers/database";
import {
  ADMIN_ID,
  USER_ID,
  adminToken,
  apiRequest,
  readJson,
  userToken,
} from "../helpers/requests";

const userRow = {
  id: USER_ID,
  name: "Taylor",
  username: "taylor",
  email: "taylor@iteso.mx",
  type: "REGULAR_USER",
  seed: "taylor-seed",
};

describe("GET /api/auth (Verificar Sesion)", () => {
  beforeEach(() => databaseMock.reset());

  it("returns the permission for an administrator", async () => {
    const response = await GET(apiRequest("/api/auth", { token: adminToken() }));

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      hasPermission: true,
    });
  });

  it("returns no permission for a regular user", async () => {
    const response = await GET(apiRequest("/api/auth", { token: userToken() }));

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      hasPermission: false,
    });
  });

  it("returns 401 without a token", async () => {
    const response = await GET(apiRequest("/api/auth"));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toMatchObject({
      error: "Unauthorized",
    });
  });

  it("returns 401 with an invalid token", async () => {
    const response = await GET(
      apiRequest("/api/auth", { token: "not-a-jwt" })
    );

    expect(response.status).toBe(401);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => databaseMock.reset());

  it("logs in an existing user and sets the token cookie", async () => {
    databaseMock.queue({ data: userRow, error: null });

    const response = await login(
      apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: "taylor@iteso.mx" },
      })
    );

    const payload = await readJson(response);
    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.user).toMatchObject({
      id: USER_ID,
      email: "taylor@iteso.mx",
      role: UserType.REGULAR_USER,
    });
    expect(typeof payload.data.token).toBe("string");
    expect(response.cookies.get("token")?.value).toBe(payload.data.token);
    expect(databaseMock.calls[0]).toMatchObject({
      table: "User",
      filters: [["email", "taylor@iteso.mx"]],
    });
  });

  it("normalizes an unknown role to the default role", async () => {
    databaseMock.queue({
      data: { ...userRow, type: "SOMETHING_ELSE" },
      error: null,
    });

    const response = await login(
      apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: "taylor@iteso.mx" },
      })
    );

    const payload = await readJson(response);
    expect(response.status).toBe(200);
    expect(payload.data.user.role).toBe(Object.values(UserType)[0]);
  });

  it("returns 400 when the email is missing", async () => {
    const response = await login(
      apiRequest("/api/auth/login", { method: "POST", body: {} })
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toMatchObject({
      success: false,
      error: "El correo electrónico es obligatorio.",
    });
  });

  it("returns 401 when the user does not exist", async () => {
    databaseMock.queue({
      data: null,
      error: { message: "not found", code: "PGRST116" },
    });

    const response = await login(
      apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: "missing@iteso.mx" },
      })
    );

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toMatchObject({
      success: false,
    });
  });

  it("returns 500 for a malformed JSON body", async () => {
    const response = await login(
      apiRequest("/api/auth/login", {
        method: "POST",
        rawBody: "{not-json",
      })
    );

    expect(response.status).toBe(500);
  });
});

describe("POST /api/auth/register", () => {
  beforeEach(() => databaseMock.reset());

  it("creates a user, returns a token and stores the cookie", async () => {
    databaseMock.queue(
      { data: null, error: null },
      {
        data: {
          id: ADMIN_ID,
          name: "Nuevo",
          username: "nuevo",
          email: "nuevo@iteso.mx",
          type: "STUDENT",
        },
        error: null,
      }
    );

    const response = await register(
      apiRequest("/api/auth/register", {
        method: "POST",
        body: { username: "nuevo", email: "nuevo@iteso.mx" },
      })
    );

    const payload = await readJson(response);
    expect(response.status).toBe(200);
    expect(payload.data.user.email).toBe("nuevo@iteso.mx");
    expect(typeof payload.data.token).toBe("string");
    expect(response.cookies.get("token")?.value).toBe(payload.data.token);
    expect(databaseMock.calls[1]).toMatchObject({
      table: "User",
      operation: "insert",
      payload: {
        name: "nuevo",
        username: "nuevo",
        email: "nuevo@iteso.mx",
        externalAuthProvider: "local",
        notificationsEnabled: true,
        type: "STUDENT",
      },
    });
  });

  it("returns 400 when username or email is missing", async () => {
    const response = await register(
      apiRequest("/api/auth/register", {
        method: "POST",
        body: { email: "nuevo@iteso.mx" },
      })
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toMatchObject({
      success: false,
      error: "Username y Email son obligatorios.",
    });
  });

  it("returns 409 when the email is already registered", async () => {
    databaseMock.queue({ data: { id: USER_ID }, error: null });

    const response = await register(
      apiRequest("/api/auth/register", {
        method: "POST",
        body: { username: "taylor", email: "taylor@iteso.mx" },
      })
    );

    expect(response.status).toBe(409);
  });

  it("returns 500 when the insert fails", async () => {
    databaseMock.queue(
      { data: null, error: null },
      { data: null, error: { message: "insert failed", code: "23505" } }
    );

    const response = await register(
      apiRequest("/api/auth/register", {
        method: "POST",
        body: { username: "nuevo", email: "nuevo@iteso.mx" },
      })
    );

    expect(response.status).toBe(500);
    await expect(readJson(response)).resolves.toMatchObject({
      success: false,
      error: "insert failed",
    });
  });

  it("returns 500 for a malformed JSON body", async () => {
    const response = await register(
      apiRequest("/api/auth/register", {
        method: "POST",
        rawBody: "not-json",
      })
    );

    expect(response.status).toBe(500);
  });
});
