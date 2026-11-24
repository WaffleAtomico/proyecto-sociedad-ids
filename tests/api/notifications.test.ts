import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/connect", async () => {
  const helper = await import("../helpers/database");
  return {
    default: helper.databaseMock,
    DatabaseUnavailableError: helper.DatabaseUnavailableError,
  };
});

import {
  GET as listNotifications,
  POST as notify,
} from "../../src/app/api/notifications/route";
import { databaseMock } from "../helpers/database";
import {
  USER_ID,
  adminToken,
  apiRequest,
  readJson,
  userToken,
} from "../helpers/requests";
import { notificationRow } from "../helpers/fixtures";

describe("POST /api/notifications (Enviar notificación)", () => {
  beforeEach(() => databaseMock.reset());

  it("creates a notification as an administrator", async () => {
    databaseMock.queue({ data: notificationRow, error: null });

    const response = await notify(
      apiRequest("/api/notifications", {
        method: "POST",
        token: adminToken(),
        body: {
          recipientId: USER_ID,
          title: "Bienvenido a Sociedad IDS",
          content: "Tu cuenta de administrador ha sido configurada correctamente.",
          notificationType: "SYSTEM",
        },
      })
    );

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: notificationRow,
    });
    expect(databaseMock.calls[0]).toMatchObject({
      table: "Notification",
      operation: "insert",
      payload: {
        recipientId: USER_ID,
        title: "Bienvenido a Sociedad IDS",
        notificationType: "SYSTEM",
        isRead: false,
      },
    });
  });

  it("defaults the notification type to SYSTEM", async () => {
    databaseMock.queue({ data: notificationRow, error: null });

    const response = await notify(
      apiRequest("/api/notifications", {
        method: "POST",
        token: adminToken(),
        body: {
          recipientId: USER_ID,
          title: "Sin tipo",
          content: "Contenido",
        },
      })
    );

    expect(response.status).toBe(201);
    expect(databaseMock.calls[0].payload).toMatchObject({
      notificationType: "SYSTEM",
    });
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await notify(
      apiRequest("/api/notifications", {
        method: "POST",
        token: adminToken(),
        body: { title: "Sin destinatario" },
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 403 for a non administrator", async () => {
    const response = await notify(
      apiRequest("/api/notifications", {
        method: "POST",
        token: userToken(),
        body: {
          recipientId: USER_ID,
          title: "Title",
          content: "Content",
        },
      })
    );

    expect(response.status).toBe(403);
  });

  it("returns 401 without a token", async () => {
    const response = await notify(
      apiRequest("/api/notifications", {
        method: "POST",
        body: {
          recipientId: USER_ID,
          title: "Title",
          content: "Content",
        },
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 when the insert fails", async () => {
    databaseMock.queue({ data: null, error: { message: "insert failed" } });

    const response = await notify(
      apiRequest("/api/notifications", {
        method: "POST",
        token: adminToken(),
        body: {
          recipientId: USER_ID,
          title: "Title",
          content: "Content",
        },
      })
    );

    expect(response.status).toBe(500);
  });
});

describe("GET /api/notifications (Listar notificación)", () => {
  beforeEach(() => databaseMock.reset());

  it("lists unread notifications for a user", async () => {
    databaseMock.queue({ data: [notificationRow], error: null });

    const response = await listNotifications(
      apiRequest("/api/notifications", {
        token: userToken(),
        searchParams: { userId: USER_ID },
      })
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: [notificationRow],
    });
    expect(databaseMock.calls[0]).toMatchObject({
      table: "Notification",
      filters: [
        ["recipientId", USER_ID],
        ["isRead", false],
      ],
      order: { column: "notificationTime" },
    });
  });

  it("returns 400 when userId is missing", async () => {
    const response = await listNotifications(
      apiRequest("/api/notifications", { token: userToken() })
    );

    expect(response.status).toBe(400);
  });

  it("returns 401 without a token", async () => {
    const response = await listNotifications(
      apiRequest("/api/notifications", {
        searchParams: { userId: USER_ID },
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 when the query fails", async () => {
    databaseMock.queue({ data: null, error: { message: "boom" } });

    const response = await listNotifications(
      apiRequest("/api/notifications", {
        token: userToken(),
        searchParams: { userId: USER_ID },
      })
    );

    expect(response.status).toBe(500);
  });
});
