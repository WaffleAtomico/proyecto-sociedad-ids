import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/connect", async () => {
  const helper = await import("../helpers/database");
  return {
    default: helper.databaseMock,
    DatabaseUnavailableError: helper.DatabaseUnavailableError,
  };
});

import { GET as getProfile } from "../../src/app/api/users/me/route";
import { PATCH as changeUsername } from "../../src/app/api/users/me/username/route";
import { PATCH as changeSeed } from "../../src/app/api/users/me/seed/route";
import { PATCH as updateNotifications } from "../../src/app/api/users/me/notifications/route";
import { databaseMock } from "../helpers/database";
import {
  USER_ID,
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

describe("GET /api/users/me", () => {
  beforeEach(() => databaseMock.reset());

  it("returns the authenticated user profile", async () => {
    databaseMock.queue({ data: userRow, error: null });

    const response = await getProfile(
      apiRequest("/api/users/me", { token: userToken() })
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: {
        id: USER_ID,
        name: "Taylor",
        username: "taylor",
        email: "taylor@iteso.mx",
        role: "REGULAR_USER",
        seed: "taylor-seed",
      },
    });
    expect(databaseMock.calls[0]).toMatchObject({
      table: "User",
      filters: [["id", USER_ID]],
    });
  });

  it("returns 401 without a token", async () => {
    const response = await getProfile(apiRequest("/api/users/me"));

    expect(response.status).toBe(401);
  });

  it("returns 500 when the profile query returns an error", async () => {
    databaseMock.queue({
      data: null,
      error: { message: "no rows", code: "PGRST116" },
    });

    const response = await getProfile(
      apiRequest("/api/users/me", { token: userToken() })
    );

    expect(response.status).toBe(500);
  });

  it("returns 500 when the query fails", async () => {
    databaseMock.queue({ data: null, error: { message: "boom" } });

    const response = await getProfile(
      apiRequest("/api/users/me", { token: userToken() })
    );

    expect(response.status).toBe(500);
  });
});

describe("PATCH /api/users/me/username", () => {
  beforeEach(() => databaseMock.reset());

  it("updates the username of the authenticated user", async () => {
    const updated = { ...userRow, username: "Taylor_swift" };
    databaseMock.queue({ data: updated, error: null });

    const response = await changeUsername(
      apiRequest("/api/users/me/username", {
        method: "PATCH",
        token: userToken(),
        body: { newUsername: "  Taylor_swift  " },
      })
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: updated,
    });
    expect(databaseMock.calls[0]).toMatchObject({
      table: "User",
      operation: "update",
      filters: [["id", USER_ID]],
      payload: { username: "Taylor_swift" },
    });
  });

  it("returns 400 when the username is missing", async () => {
    const response = await changeUsername(
      apiRequest("/api/users/me/username", {
        method: "PATCH",
        token: userToken(),
        body: {},
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when the user does not exist", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await changeUsername(
      apiRequest("/api/users/me/username", {
        method: "PATCH",
        token: userToken(),
        body: { newUsername: "nuevo" },
      })
    );

    expect(response.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const response = await changeUsername(
      apiRequest("/api/users/me/username", {
        method: "PATCH",
        body: { newUsername: "nuevo" },
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 when the update fails", async () => {
    databaseMock.queue({ data: null, error: { message: "update failed" } });

    const response = await changeUsername(
      apiRequest("/api/users/me/username", {
        method: "PATCH",
        token: userToken(),
        body: { newUsername: "nuevo" },
      })
    );

    expect(response.status).toBe(500);
  });
});

describe("PATCH /api/users/me/seed", () => {
  beforeEach(() => databaseMock.reset());

  it("updates the seed of the authenticated user", async () => {
    const updated = { ...userRow, seed: "nuevo-seed" };
    databaseMock.queue({ data: updated, error: null });

    const response = await changeSeed(
      apiRequest("/api/users/me/seed", {
        method: "PATCH",
        token: userToken(),
        body: { seed: "nuevo-seed" },
      })
    );

    expect(response.status).toBe(200);
    expect(databaseMock.calls[0]).toMatchObject({
      operation: "update",
      filters: [["id", USER_ID]],
      payload: { seed: "nuevo-seed" },
    });
  });

  it("returns 400 when the seed is missing", async () => {
    const response = await changeSeed(
      apiRequest("/api/users/me/seed", {
        method: "PATCH",
        token: userToken(),
        body: { seed: "   " },
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when the user does not exist", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await changeSeed(
      apiRequest("/api/users/me/seed", {
        method: "PATCH",
        token: userToken(),
        body: { seed: "nuevo-seed" },
      })
    );

    expect(response.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const response = await changeSeed(
      apiRequest("/api/users/me/seed", {
        method: "PATCH",
        body: { seed: "nuevo-seed" },
      })
    );

    expect(response.status).toBe(401);
  });
});

describe("PATCH /api/users/me/notifications (Preferencias notificaciones)", () => {
  beforeEach(() => databaseMock.reset());

  it("updates the notification preference", async () => {
    const updated = { ...userRow, notificationsEnabled: true };
    databaseMock.queue({ data: updated, error: null });

    const response = await updateNotifications(
      apiRequest("/api/users/me/notifications", {
        method: "PATCH",
        token: userToken(),
        body: { enabled: true },
      })
    );

    expect(response.status).toBe(200);
    expect(databaseMock.calls[0]).toMatchObject({
      operation: "update",
      filters: [["id", USER_ID]],
      payload: { notificationsEnabled: true },
    });
  });

  it("returns 400 when enabled is not a boolean", async () => {
    const response = await updateNotifications(
      apiRequest("/api/users/me/notifications", {
        method: "PATCH",
        token: userToken(),
        body: { enabled: "true" },
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when the user does not exist", async () => {
    databaseMock.queue({ data: null, error: null });

    const response = await updateNotifications(
      apiRequest("/api/users/me/notifications", {
        method: "PATCH",
        token: userToken(),
        body: { enabled: false },
      })
    );

    expect(response.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const response = await updateNotifications(
      apiRequest("/api/users/me/notifications", {
        method: "PATCH",
        body: { enabled: true },
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 when the update fails", async () => {
    databaseMock.queue({ data: null, error: { message: "update failed" } });

    const response = await updateNotifications(
      apiRequest("/api/users/me/notifications", {
        method: "PATCH",
        token: userToken(),
        body: { enabled: true },
      })
    );

    expect(response.status).toBe(500);
  });
});
